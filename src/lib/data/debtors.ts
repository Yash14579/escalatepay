"use server";

import { createClient } from "@/lib/supabase/server";
import type { Debtor } from "@/lib/debtors/types";

function friendlyDbError(message: string): string {
  if (message.includes("PGRST205") || message.includes("schema cache")) {
    return "The database tables are not set up yet. Run supabase-schema.sql, then supabase-debtor-reminders.sql, in your Supabase SQL editor.";
  }
  return message;
}

export async function getDebtors(): Promise<Debtor[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("debtors")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDebtors failed:", error.message);
    return [];
  }
  return (data ?? []) as Debtor[];
}

export async function getDebtor(id: string): Promise<Debtor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("debtors")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getDebtor failed:", error.message);
    return null;
  }
  return (data as Debtor) ?? null;
}

export async function createDebtor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "USD");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;

  const interval = clampInt(formData.get("reminder_interval_days"), 1, 365, 10);
  const maxReminders = clampInt(formData.get("max_reminders"), 1, 50, 6);
  const reminderTime = normalizeTime(String(formData.get("reminder_time") ?? "10:00"));
  const autoSend = formData.get("auto_send") === "on";
  const reminderMessage = String(formData.get("reminder_message") ?? "").trim() || null;

  if (!name) throw new Error("A name is required");
  if (!phone) throw new Error("A phone number is required");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("The amount must be more than zero");
  }

  const next = new Date();
  next.setUTCDate(next.getUTCDate() + interval);
  applyTimeOfDay(next, reminderTime);

  const { data, error } = await supabase
    .from("debtors")
    .insert({
      owner_id: user.id,
      name,
      phone,
      amount_minor: Math.round(amount * 100),
      currency,
      reason,
      due_date: dueDate,
      status: "pending",
      reminder_interval_days: interval,
      max_reminders: maxReminders,
      reminder_time: reminderTime,
      auto_send: autoSend,
      reminder_message: reminderMessage,
      next_reminder_at: next.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(friendlyDbError(error.message));
  return data as Debtor;
}

export async function updateDebtorSchedule(
  id: string,
  patch: {
    reminder_interval_days?: number;
    reminder_time?: string;
    max_reminders?: number;
    auto_send?: boolean;
    reminder_message?: string | null;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.reminder_interval_days !== undefined) {
    const v = Math.round(patch.reminder_interval_days);
    if (v < 1 || v > 365) throw new Error("Interval must be between 1 and 365 days");
    row.reminder_interval_days = v;
    // Re-anchor the next reminder to the new rhythm.
    const next = new Date();
    next.setUTCDate(next.getUTCDate() + v);
    if (patch.reminder_time) applyTimeOfDay(next, patch.reminder_time);
    row.next_reminder_at = next.toISOString();
  }
  if (patch.reminder_time !== undefined) {
    row.reminder_time = normalizeTime(patch.reminder_time);
  }
  if (patch.max_reminders !== undefined) {
    const v = Math.round(patch.max_reminders);
    if (v < 1 || v > 50) throw new Error("At most 50 reminders");
    row.max_reminders = v;
  }
  if (patch.auto_send !== undefined) row.auto_send = patch.auto_send;
  if (patch.reminder_message !== undefined) {
    row.reminder_message = patch.reminder_message?.trim() || null;
  }

  const { error } = await supabase
    .from("debtors")
    .update(row)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

export async function updateDebtorStatus(
  id: string,
  status: "pending" | "reminded" | "partial" | "paid",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const row: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "paid") row.next_reminder_at = null;

  const { error } = await supabase
    .from("debtors")
    .update(row)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

export async function markPartial(id: string, amountPaidMinor: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: current } = await supabase
    .from("debtors")
    .select("amount_minor")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  const paid = Math.max(0, Math.round(amountPaidMinor));
  const fullyPaid = current ? paid >= current.amount_minor : false;

  const { error } = await supabase
    .from("debtors")
    .update({
      amount_paid_minor: paid,
      status: fullyPaid ? "paid" : "partial",
      next_reminder_at: fullyPaid ? null : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

/** Records that a reminder went out, and moves the schedule forward. */
export async function recordReminderSent(
  id: string,
  opts: { channel: "whatsapp" | "sms" | "email"; body: string; outcome: "sent" | "queued" },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: d } = await supabase
    .from("debtors")
    .select("id, phone, reminder_interval_days, max_reminders, reminder_count, next_reminder_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!d) throw new Error("Person not found");

  const now = new Date();
  const count = (d.reminder_count ?? 0) + 1;
  const base = d.next_reminder_at ? new Date(d.next_reminder_at) : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + (d.reminder_interval_days ?? 10));
  if (next.getTime() <= now.getTime()) {
    next.setTime(now.getTime() + (d.reminder_interval_days ?? 10) * 86_400_000);
  }
  const done = count >= (d.max_reminders ?? 6);

  const { error } = await supabase
    .from("debtors")
    .update({
      reminder_count: count,
      last_reminded_at: now.toISOString(),
      next_reminder_at: done ? null : next.toISOString(),
      status: "reminded",
      updated_at: now.toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));

  await supabase.from("debtor_reminder_logs").insert({
    debtor_id: id,
    owner_id: user.id,
    channel: opts.channel,
    outcome: opts.outcome,
    to_address: d.phone,
    body: opts.body,
  });
}

export async function deleteDebtor(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("debtors")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

/* ---------- small helpers ---------- */

function clampInt(raw: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Accepts "9", "09:30", "9:30" and returns "HH:MM". */
function normalizeTime(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):?(\d{2})?$/);
  if (!m) return "10:00";
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2] ?? "0")));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function applyTimeOfDay(target: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  target.setUTCHours(h || 0, m || 0, 0, 0);
}
