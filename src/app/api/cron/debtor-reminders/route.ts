import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const maxDuration = 300;

/**
 * Runs once a day from Vercel Cron.
 *
 * For each person whose next reminder is due:
 *   - if they are set to auto_send AND a bridge is connected, send it
 *   - otherwise mark them due, so the dashboard shows a one-tap button
 *
 * Nothing here ever invents a message or sends to someone who asked to stop.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("debtors")
    .select("*")
    .neq("status", "paid")
    .not("next_reminder_at", "is", null)
    .lte("next_reminder_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let autoSent = 0;
  let queued = 0;

  for (const d of due ?? []) {
    // Hard stop at the person's own limit.
    if ((d.reminder_count ?? 0) >= (d.max_reminders ?? 6)) continue;

    // Skip anyone who opted out.
    const { data: optOut } = await supabase
      .from("opt_outs")
      .select("id")
      .eq("phone", d.phone)
      .maybeSingle();
    if (optOut) continue;

    if (d.auto_send) {
      // Auto-send needs a WhatsApp bridge. Until one is connected, fall through
      // to queuing so the person is not silently skipped.
      const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL;
      const bridgeKey = process.env.WHATSAPP_BRIDGE_KEY;
      const bridgeSession = process.env.WHATSAPP_BRIDGE_SESSION;

      if (bridgeUrl && bridgeSession) {
        const message = buildMessage(d);
        try {
          const res = await fetch(`${bridgeUrl.replace(/\/$/, "")}/api/sendText`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(bridgeKey ? { "X-Api-Key": bridgeKey } : {}),
            },
            body: JSON.stringify({
              session: bridgeSession,
              chatId: `${d.phone.replace(/[^\d]/g, "")}@c.us`,
              text: message,
            }),
          });

          await supabase.from("debtor_reminder_logs").insert({
            debtor_id: d.id,
            owner_id: d.owner_id,
            channel: "whatsapp",
            outcome: res.ok ? "sent" : "failed",
            to_address: d.phone,
            body: message,
            error: res.ok ? null : `Bridge returned ${res.status}`,
          });

          if (res.ok) {
            await advance(supabase, d);
            autoSent++;
            continue;
          }
        } catch (err) {
          await supabase.from("debtor_reminder_logs").insert({
            debtor_id: d.id,
            owner_id: d.owner_id,
            channel: "whatsapp",
            outcome: "failed",
            to_address: d.phone,
            body: buildMessage(d),
            error: err instanceof Error ? err.message : "Bridge error",
          });
        }
      }
    }

    // Not auto-sending: leave next_reminder_at where it is so the app keeps
    // showing "due" until the person actually taps send.
    queued++;
  }

  return NextResponse.json({ ok: true, autoSent, queued });
}

function buildMessage(d: {
  name: string;
  reason: string | null;
  amount_minor: number;
  amount_paid_minor: number | null;
  currency: string;
  reminder_message: string | null;
}): string {
  const remainingMinor = Math.max(0, d.amount_minor - (d.amount_paid_minor ?? 0));
  let amount = `${(remainingMinor / 100).toFixed(2)} ${d.currency}`;
  try {
    amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: d.currency,
    }).format(remainingMinor / 100);
  } catch {
    /* keep the plain fallback */
  }

  if (d.reminder_message && d.reminder_message.trim()) {
    return d.reminder_message
      .replace(/\{\{\s*name\s*\}\}/gi, d.name)
      .replace(/\{\{\s*amount\s*\}\}/gi, amount)
      .replace(/\{\{\s*reason\s*\}\}/gi, d.reason ?? "");
  }

  const tail = d.reason ? ` for ${d.reason}` : "";
  return `Hi ${d.name}, a friendly reminder that ${amount} is still outstanding${tail}. Please pay when you can. Thank you.`;
}

async function advance(
  supabase: SupabaseClient,
  d: {
    id: string;
    owner_id: string;
    reminder_interval_days: number;
    max_reminders: number;
    reminder_count: number;
    next_reminder_at: string | null;
  },
): Promise<void> {
  const now = new Date();
  const count = (d.reminder_count ?? 0) + 1;
  const base = d.next_reminder_at ? new Date(d.next_reminder_at) : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + (d.reminder_interval_days ?? 10));
  if (next.getTime() <= now.getTime()) {
    next.setTime(now.getTime() + (d.reminder_interval_days ?? 10) * 86_400_000);
  }
  const finished = count >= (d.max_reminders ?? 6);

  await supabase
    .from("debtors")
    .update({
      reminder_count: count,
      last_reminded_at: now.toISOString(),
      next_reminder_at: finished ? null : next.toISOString(),
      status: "reminded",
      updated_at: now.toISOString(),
    })
    .eq("id", d.id);
}
