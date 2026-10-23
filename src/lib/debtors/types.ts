import type { Channel, StepKey } from "@/lib/types";

/**
 * A person who owes money, with their own reminder rhythm.
 *
 * Timing is per person on purpose: one client wants a nudge every week, another
 * every month. The defaults are a starting point, not a rule.
 */
export interface Debtor {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  amount_minor: number;
  amount_paid_minor: number;
  currency: string;
  reason: string | null;
  due_date: string | null;
  status: "pending" | "reminded" | "partial" | "paid";
  last_reminded_at: string | null;

  /** Days between reminders. Default 10. */
  reminder_interval_days: number;
  /** Local time of day to send, "HH:MM". Default 10:00. */
  reminder_time: string;
  /** Hard stop after this many reminders. Default 6. */
  max_reminders: number;
  reminder_count: number;
  next_reminder_at: string | null;
  /** False means the app prepares the message and you tap to send. */
  auto_send: boolean;
  /** Optional custom wording. Null uses the built-in default. */
  reminder_message: string | null;
  /** Which channel this person's reminders go out on. */
  reminder_channel: "whatsapp" | "sms";
}

export const DEBTOR_DEFAULTS = {
  reminder_interval_days: 10,
  reminder_time: "10:00",
  max_reminders: 6,
  auto_send: false,
} as const;

/** The amount that is actually still owed. */
export function remainingMinor(d: Debtor): number {
  return Math.max(0, d.amount_minor - (d.amount_paid_minor || 0));
}

/**
 * Is this person due a reminder right now?
 *
 * Rules, in order:
 *   - paid or cancelled people never get one
 *   - stopped after max_reminders, so nobody gets hounded forever
 *   - not before next_reminder_at
 */
export function isReminderDue(d: Debtor, now: Date): boolean {
  if (d.status === "paid") return false;
  if (d.reminder_count >= d.max_reminders) return false;
  if (!d.next_reminder_at) return false;
  return new Date(d.next_reminder_at).getTime() <= now.getTime();
}

/**
 * When the next reminder lands after one is sent.
 * Advances from the schedule, not from "now", so a late run does not drift
 * the whole cadence forward.
 */
export function nextReminderAfter(d: Debtor, sentAt: Date): Date | null {
  if (d.reminder_count + 1 >= d.max_reminders) return null;
  const base = d.next_reminder_at ? new Date(d.next_reminder_at) : sentAt;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + d.reminder_interval_days);
  // If the schedule fell far behind, keep it in the future.
  if (next.getTime() <= sentAt.getTime()) {
    next.setTime(sentAt.getTime() + d.reminder_interval_days * 86_400_000);
  }
  return next;
}

/** Builds the reminder text. Falls back to a clear, non-threatening default. */
export function buildReminderMessage(d: Debtor, formattedAmount: string): string {
  if (d.reminder_message && d.reminder_message.trim()) {
    return d.reminder_message
      .replace(/\{\{\s*name\s*\}\}/gi, d.name)
      .replace(/\{\{\s*amount\s*\}\}/gi, formattedAmount)
      .replace(/\{\{\s*reason\s*\}\}/gi, d.reason ?? "");
  }
  const tail = d.reason ? ` for ${d.reason}` : "";
  return `Hi ${d.name}, a friendly reminder that ${formattedAmount} is still outstanding${tail}. Please pay when you can. Thank you.`;
}

export interface DebtorReminderLog {
  id: string;
  debtor_id: string;
  owner_id: string;
  channel: Channel;
  outcome: "sent" | "queued" | "failed" | "skipped";
  to_address: string;
  body: string;
  error?: string | null;
  created_at: string;
}

export type { Channel, StepKey };
