import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "armed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  let processed = 0;

  for (const inv of invoices ?? []) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: inv.recipient_timezone || "America/New_York",
        hour: "numeric",
        hour12: false,
      }).formatToParts(now);
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
      if (h < 9 || h >= 18) continue;
    } catch {}

    const { data: sent } = await supabase
      .from("send_logs")
      .select("step")
      .eq("invoice_id", inv.id)
      .eq("outcome", "sent");

    const sentSteps = (sent ?? []).map((s) => s.step);
    const schedule = inv.schedule || { day3: 3, day7: 7, day14: 14, day30: 30 };
    const order = ["day3", "day7", "day14", "day30"];
    const dueAt = new Date(inv.due_at);

    for (const step of order) {
      if (sentSteps.includes(step)) continue;
      const fireAt = new Date(dueAt);
      fireAt.setUTCDate(fireAt.getUTCDate() + (schedule[step] || 0));
      if (fireAt.getTime() > now.getTime()) continue;

      if (inv.recipient_email) {
        const { data: opt } = await supabase
          .from("opt_outs")
          .select("id")
          .eq("email", inv.recipient_email)
          .maybeSingle();
        if (opt) continue;
      }

      await supabase.from("send_logs").insert({
        invoice_id: inv.id,
        owner_id: inv.owner_id,
        step,
        channel: "email",
        outcome: "queued",
        to_address: inv.recipient_email || inv.recipient_phone || "unknown",
        subject: `[${step}] Invoice ${inv.number}`,
        body: "Queued by scheduler. Connect a sender in Settings to dispatch.",
      });
      processed++;
      break;
    }
  }

  return NextResponse.json({ ok: true, processed });
}
