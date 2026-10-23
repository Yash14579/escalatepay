import type {
  Channel,
  Invoice,
  OutboundMessage,
  SendLogEntry,
  SendOutcome,
  StepKey,
} from "@/lib/types";
import type { MessageProvider } from "@/lib/providers/types";
import {
  STEP_LABEL,
  nextStep,
  stepDueAt,
  withinQuietHours,
} from "@/lib/engine/schedule";
import { amountFor, renderTemplate } from "@/lib/engine/templates";
import { smsDeepLink, whatsappDeepLink } from "@/lib/providers/types";

/**
 * Runs one invoice for one tick.
 *
 * This function is deliberately pure about its inputs and outputs: it is given
 * the invoice, what has already been sent, and a provider, and it returns what
 * happened. Persisting the result is the caller's job. That keeps it testable
 * and keeps double-sends impossible at the database layer with a unique
 * constraint on (invoice_id, step).
 */
export interface RunInput {
  invoice: Invoice;
  alreadySent: StepKey[];
  channel: Channel;
  provider: MessageProvider | null;
  freelancerName: string;
  appName?: string;
  optOutUrl: string;
  lateFeeNote?: string;
  now: Date;
}

export interface RunOutcome {
  action: "none" | "sent" | "failed" | "skipped" | "queued";
  step?: StepKey;
  log?: Omit<SendLogEntry, "id">;
  reason?: string;
  deepLink?: string;
}

export async function runInvoice(input: RunInput): Promise<RunOutcome> {
  const { invoice, alreadySent, channel, provider, now } = input;

  const armed = invoice.armedAt ? new Date(invoice.armedAt) : null;
  if (invoice.status !== "armed") {
    return { action: "none", reason: "Invoice is not armed." };
  }
  // Never fire a step before the invoice was armed.
  if (armed && armed.getTime() > now.getTime()) {
    return { action: "none", reason: "Arming takes effect from now." };
  }
  if (!withinQuietHours(invoice.recipient.timeZone, now)) {
    return { action: "none", reason: "Outside the recipient's allowed hours." };
  }

  const step = nextStep(invoice, alreadySent, now);
  if (!step) {
    return { action: "none", reason: "Nothing is due." };
  }

  const due = stepDueAt(invoice, step);
  const daysOverdue = Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(invoice.dueAt).getTime()) / 86_400_000,
    ),
  );

  const { subject, body } = renderTemplate(
    // Templates are user editable later; defaults for now.
    (await import("@/lib/engine/templates")).DEFAULT_TEMPLATES[step],
    {
      clientName: invoice.recipient.name,
      freelancerName: input.freelancerName,
      invoiceNumber: invoice.number,
      amount: amountFor(invoice),
      dueDate: new Date(invoice.dueAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      daysOverdue,
      appName: input.appName ?? "EscalatePay",
      lateFeeNote: input.lateFeeNote,
      optOutUrl: input.optOutUrl,
    },
  );

  const to =
    channel === "email"
      ? invoice.recipient.email
      : invoice.recipient.phoneE164;

  if (!to) {
    return {
      action: "skipped",
      step,
      reason: `No ${channel === "email" ? "email address" : "phone number"} for this client.`,
    };
  }

  const msg: OutboundMessage = {
    to,
    subject: channel === "email" ? subject : undefined,
    body,
    replyTo: channel === "email" ? invoice.recipient.email : undefined,
    fromName: input.freelancerName,
  };

  // Assisted channels never call a network; they hand back a link to tap.
  if (channel === "sms" && provider?.mode === "assisted") {
    msg.deepLink = smsDeepLink(to, body);
  } else if (channel === "whatsapp" && provider?.mode === "assisted") {
    msg.deepLink = whatsappDeepLink(to, body);
  }

  let outcome: SendOutcome = "queued";
  let providerId: string | undefined;
  let error: string | undefined;

  if (provider) {
    const result = await provider.send(msg);
    outcome = result.outcome;
    providerId = result.providerId;
    error = result.error;
  } else if (!msg.deepLink) {
    error = "No sender is configured for this channel.";
    outcome = "skipped";
  } else {
    providerId = msg.deepLink;
  }

  const log: Omit<SendLogEntry, "id"> = {
    invoiceId: invoice.id,
    step,
    channel,
    outcome,
    to,
    subject: msg.subject,
    body,
    sentAt: now.toISOString(),
    providerId,
    error,
  };

  return {
    action:
      outcome === "sent"
        ? "sent"
        : outcome === "failed"
          ? "failed"
          : outcome === "skipped"
            ? "skipped"
            : "queued",
    step,
    log,
    reason: error ?? `${STEP_LABEL[step]} due ${due.toISOString().slice(0, 10)}`,
    deepLink: msg.deepLink,
  };
}
