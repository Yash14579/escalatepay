import type { Invoice, StepKey } from "@/lib/types";

/**
 * The escalation ladder. These are the defaults; each invoice stores its own
 * copy so a user can slow one down without touching the others.
 *
 * Four messages, minimum three days apart, ending on day 30. That satisfies
 * the "max 4 to 5 messages over the lifecycle" cap by construction.
 */
export const DEFAULT_SCHEDULE: Record<StepKey, number> = {
  day3: 3,
  day7: 7,
  day14: 14,
  day30: 30,
};

export const STEP_ORDER: StepKey[] = ["day3", "day7", "day14", "day30"];

export const STEP_LABEL: Record<StepKey, string> = {
  day3: "Friendly reminder",
  day7: "Firm follow-up",
  day14: "Late fee notice",
  day30: "Formal demand letter",
};

export const MAX_MESSAGES_PER_LIFECYCLE = 5;
export const MIN_DAYS_BETWEEN_STEPS = 3;

/** Quiet hours in the recipient's local time. Configurable per account later. */
export const QUIET_HOURS = { startHour: 9, endHour: 18 } as const;

export function addDays(iso: string, days: number): Date {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** When step N is due for this invoice. */
export function stepDueAt(invoice: Invoice, step: StepKey): Date {
  return addDays(invoice.dueAt, invoice.schedule[step]);
}

/**
 * The step that should fire now, or null. Walks in order and returns the
 * first step that is due and has not been sent yet.
 */
export function nextStep(
  invoice: Invoice,
  alreadySent: StepKey[],
  now: Date,
): StepKey | null {
  if (invoice.status !== "armed") return null;
  for (const step of STEP_ORDER) {
    if (alreadySent.includes(step)) continue;
    if (stepDueAt(invoice, step).getTime() <= now.getTime()) return step;
  }
  return null;
}

/** Validate a custom schedule so nobody can make it spam a client. */
export function isValidSchedule(s: Record<StepKey, number>): boolean {
  let prev = -Infinity;
  for (const step of STEP_ORDER) {
    const d = s[step];
    if (!Number.isFinite(d) || d < 0) return false;
    if (d - prev < MIN_DAYS_BETWEEN_STEPS) return false;
    prev = d;
  }
  return true;
}

/**
 * Is it inside the allowed sending window in the recipient's zone?
 * Uses Intl so it works without a timezone library.
 */
export function withinQuietHours(timeZone: string, now: Date): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
    return hour >= QUIET_HOURS.startHour && hour < QUIET_HOURS.endHour;
  } catch {
    // Unknown zone: send at UTC business hours rather than not at all.
    const h = now.getUTCHours();
    return h >= QUIET_HOURS.startHour && h < QUIET_HOURS.endHour;
  }
}
