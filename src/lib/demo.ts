import type { Invoice, SendLogEntry, StepKey } from "@/lib/types";
import { DEFAULT_SCHEDULE } from "@/lib/engine/schedule";

/**
 * Seeded demo data. Used until Supabase is connected, so the app is walkable
 * from the first minute instead of showing empty states.
 *
 * Everything here is invented and clearly labelled as sample data in the UI.
 * No real names, no real addresses.
 */
const now = new Date();

function iso(daysFromNow: number): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
}

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    ownerId: "demo",
    number: "INV-1042",
    amountMinor: 240000,
    currency: "USD",
    issuedAt: iso(-45),
    dueAt: iso(-18),
    status: "armed",
    recipient: {
      name: "Sample Client A",
      email: "billing@example.com",
      phoneE164: "+15550100001",
      timeZone: "America/New_York",
    },
    schedule: DEFAULT_SCHEDULE,
    armedAt: iso(-18),
    createdAt: iso(-45),
  },
  {
    id: "inv-2",
    ownerId: "demo",
    number: "INV-1043",
    amountMinor: 85000,
    currency: "USD",
    issuedAt: iso(-20),
    dueAt: iso(-6),
    status: "armed",
    recipient: {
      name: "Sample Client B",
      email: "accounts@example.org",
      phoneE164: "+15550100002",
      timeZone: "America/Los_Angeles",
    },
    schedule: DEFAULT_SCHEDULE,
    armedAt: iso(-6),
    createdAt: iso(-20),
  },
  {
    id: "inv-3",
    ownerId: "demo",
    number: "INV-1039",
    amountMinor: 460000,
    currency: "USD",
    issuedAt: iso(-60),
    dueAt: iso(-32),
    status: "paid",
    recipient: {
      name: "Sample Client C",
      email: "ap@example.net",
      phoneE164: "+15550100003",
      timeZone: "Europe/London",
    },
    schedule: DEFAULT_SCHEDULE,
    armedAt: iso(-32),
    paidAt: iso(-3),
    createdAt: iso(-60),
  },
  {
    id: "inv-4",
    ownerId: "demo",
    number: "INV-1044",
    amountMinor: 120000,
    currency: "USD",
    issuedAt: iso(-9),
    dueAt: iso(4),
    status: "paused",
    recipient: {
      name: "Sample Client D",
      email: "finance@example.com",
      timeZone: "Asia/Kolkata",
    },
    schedule: DEFAULT_SCHEDULE,
    createdAt: iso(-9),
  },
];

export const DEMO_LOGS: SendLogEntry[] = [
  {
    id: "log-1",
    invoiceId: "inv-1",
    step: "day3",
    channel: "email",
    outcome: "sent",
    to: "billing@example.com",
    subject: "Quick check on invoice INV-1042",
    body: "Hi Sample Client A,\n\nJust a quick note that invoice INV-1042 for $2,400.00 was due on...",
    sentAt: iso(-15),
    providerId: "demo",
  },
  {
    id: "log-2",
    invoiceId: "inv-1",
    step: "day7",
    channel: "email",
    outcome: "sent",
    to: "billing@example.com",
    subject: "Invoice INV-1042 is 7 days overdue",
    body: "Hi Sample Client A,\n\nInvoice INV-1042 for $2,400.00 is now 7 days past its due date...",
    sentAt: iso(-11),
    providerId: "demo",
  },
  {
    id: "log-3",
    invoiceId: "inv-1",
    step: "day14",
    channel: "email",
    outcome: "sent",
    to: "billing@example.com",
    subject: "Late fee now applies to invoice INV-1042",
    body: "Hi Sample Client A,\n\nInvoice INV-1042 for $2,400.00 remains unpaid 14 days after...",
    sentAt: iso(-4),
    providerId: "demo",
  },
  {
    id: "log-4",
    invoiceId: "inv-2",
    step: "day3",
    channel: "email",
    outcome: "sent",
    to: "accounts@example.org",
    subject: "Quick check on invoice INV-1043",
    body: "Hi Sample Client B,\n\nJust a quick note that invoice INV-1043 for $850.00 was due on...",
    sentAt: iso(-3),
    providerId: "demo",
  },
];

export function sentStepsFor(invoiceId: string): StepKey[] {
  return DEMO_LOGS.filter(
    (l) => l.invoiceId === invoiceId && l.outcome === "sent",
  ).map((l) => l.step);
}

export function logsFor(invoiceId: string): SendLogEntry[] {
  return DEMO_LOGS.filter((l) => l.invoiceId === invoiceId).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
}
