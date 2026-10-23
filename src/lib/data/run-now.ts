"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enabledBridgeFor } from "@/lib/data/bridges";
import { sendViaBridge } from "@/lib/bridges/send";
import { buildReminderMessage, remainingMinor, type Debtor } from "@/lib/debtors/types";
import { formatCurrency } from "@/lib/currencies";

export interface RunResult {
  ok: boolean;
  message: string;
  sent: number;
  waiting: number;
  failed: number;
  details: string[];
}

/** Daily ceiling per channel, so a bug cannot empty someone's SMS plan. */
const DAILY_CAP = { sms: 40, whatsapp: 60 } as const;

/**
 * Runs the due check by hand, the same work the scheduled job does.
 *
 * Anything with a connected bridge and auto-send on goes out now.
 * Everything else is reported as waiting, so the user can send it by hand.
 */
export async function runDueNow(): Promise<RunResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message: "Sign in first.",
      sent: 0,
      waiting: 0,
      failed: 0,
      details: [],
    };
  }

  const { data: due, error } = await supabase
    .from("debtors")
    .select("*")
    .eq("owner_id", user.id)
    .neq("status", "paid")
    .not("next_reminder_at", "is", null)
    .lte("next_reminder_at", new Date().toISOString());

  if (error) {
    return {
      ok: false,
      message: "Could not read who is due.",
      sent: 0,
      waiting: 0,
      failed: 0,
      details: [error.message],
    };
  }

  const bridges = {
    whatsapp: await enabledBridgeFor("whatsapp"),
    sms: await enabledBridgeFor("sms"),
  };

  const details: string[] = [];
  let sent = 0;
  let waiting = 0;
  let failed = 0;

  for (const row of (due ?? []) as Debtor[]) {
    const channel = row.reminder_channel === "sms" ? "sms" : "whatsapp";
    const bridge = bridges[channel];

    if (!row.auto_send || !bridge) {
      waiting++;
      continue;
    }

    // Respect the person's own limit.
    if (row.reminder_count >= row.max_reminders) continue;

    const text = buildReminderMessage(
      row,
      formatCurrency(remainingMinor(row), row.currency),
    );

    const cap = DAILY_CAP[channel];
    const { count } = await supabase
      .from("debtor_reminder_logs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("channel", channel)
      .eq("outcome", "sent")
      .gte("created_at", new Date().toISOString().slice(0, 10));

    if ((count ?? 0) >= cap) {
      details.push(`Daily limit of ${cap} reached for ${channel}. Nothing more sent.`);
      break;
    }

    const result = await sendViaBridge(bridge, row.phone, text);

    await supabase.from("debtor_reminder_logs").insert({
      debtor_id: row.id,
      owner_id: user.id,
      channel,
      outcome: result.ok ? "sent" : "failed",
      to_address: row.phone,
      body: text,
      error: result.ok ? null : result.detail,
    });

    if (result.ok) {
      sent++;
      details.push(`Sent to ${row.name}.`);
      await advance(supabase, row);
    } else {
      failed++;
      details.push(`${row.name}: ${result.detail}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/debtors");

  return {
    ok: true,
    message:
      sent + failed + waiting === 0
        ? "Nobody is due right now."
        : `Sent ${sent}, failed ${failed}, waiting for one tap ${waiting}.`,
    sent,
    waiting,
    failed,
    details,
  };
}

async function advance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  d: Debtor,
) {
  const now = new Date();
  const count = (d.reminder_count ?? 0) + 1;
  const base = d.next_reminder_at ? new Date(d.next_reminder_at) : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + (d.reminder_interval_days ?? 10));
  if (next.getTime() <= now.getTime()) {
    next.setTime(now.getTime() + (d.reminder_interval_days ?? 10) * 86_400_000);
  }
  const done = count >= (d.max_reminders ?? 6);

  await supabase
    .from("debtors")
    .update({
      reminder_count: count,
      last_reminded_at: now.toISOString(),
      next_reminder_at: done ? null : next.toISOString(),
      status: "reminded",
      updated_at: now.toISOString(),
    })
    .eq("id", d.id)
    .eq("owner_id", d.owner_id);
}
