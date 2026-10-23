/**
 * Core domain types for EscalatePay.
 *
 * The app is a first-party reminder tool: every message is sent on behalf of
 * the freelancer who armed the invoice, never as a third-party collector.
 */

export type Channel = "email" | "whatsapp" | "sms";

export type InvoiceStatus = "draft" | "armed" | "paused" | "paid" | "cancelled";

export type StepKey = "day3" | "day7" | "day14" | "day30";

export type SendOutcome = "sent" | "failed" | "skipped" | "queued" | "cancelled";

export interface Recipient {
  name: string;
  email?: string;
  phoneE164?: string;
  /** IANA zone, e.g. "Asia/Kolkata". Used for quiet hours. */
  timeZone: string;
}

export interface Invoice {
  id: string;
  ownerId: string;
  number: string;
  amountMinor: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  recipient: Recipient;
  /** Days after the due date at which each step fires. */
  schedule: Record<StepKey, number>;
  armedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface SendLogEntry {
  id: string;
  invoiceId: string;
  step: StepKey;
  channel: Channel;
  outcome: SendOutcome;
  to: string;
  subject?: string;
  body: string;
  sentAt: string;
  providerId?: string;
  error?: string;
}

/** What a sender needs to actually deliver one message. */
export interface OutboundMessage {
  to: string;
  subject?: string;
  body: string;
  replyTo?: string;
  fromName: string;
  /**
   * For tap-to-send channels there is no server send at all. The engine
   * returns a deep link the user taps on their own phone.
   */
  deepLink?: string;
}

export interface SendResult {
  outcome: SendOutcome;
  providerId?: string;
  error?: string;
}
