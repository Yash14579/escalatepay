import type { Invoice, StepKey } from "@/lib/types";

export interface TemplateContext {
  clientName: string;
  freelancerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  /** Shown as the disclosure footer on every message. */
  appName: string;
  lateFeeNote?: string;
  optOutUrl: string;
}

export const DEFAULT_TEMPLATES: Record<StepKey, { subject: string; body: string }> = {
  day3: {
    subject: "Quick check on invoice {{invoiceNumber}}",
    body: `Hi {{clientName}},

Just a quick note that invoice {{invoiceNumber}} for {{amount}} was due on {{dueDate}}. If it is already on its way, please ignore this.

You can reply straight to this email if anything is unclear.

Thanks,
{{freelancerName}}`,
  },
  day7: {
    subject: "Invoice {{invoiceNumber}} is {{daysOverdue}} days overdue",
    body: `Hi {{clientName}},

Invoice {{invoiceNumber}} for {{amount}} is now {{daysOverdue}} days past its due date of {{dueDate}}.

Could you confirm when payment will go out? If there is an issue holding it up, tell me and we can sort it out.

Thanks,
{{freelancerName}}`,
  },
  day14: {
    subject: "Late fee now applies to invoice {{invoiceNumber}}",
    body: `Hi {{clientName}},

Invoice {{invoiceNumber}} for {{amount}} remains unpaid {{daysOverdue}} days after the due date of {{dueDate}}.

{{lateFeeNote}}

Please arrange payment this week so we can close this out.

Thanks,
{{freelancerName}}`,
  },
  day30: {
    subject: "Formal demand: invoice {{invoiceNumber}}, {{amount}} outstanding",
    body: `Hi {{clientName}},

Despite several reminders, invoice {{invoiceNumber}} for {{amount}} is still unpaid {{daysOverdue}} days after its due date of {{dueDate}}.

This is a formal request for payment in full within 14 days. If I do not hear from you, I will consider next steps available to me to recover the amount.

If the delay is due to a dispute or a cash flow issue, reply and we can discuss it.

Regards,
{{freelancerName}}`,
  },
};

const DEFAULT_LATE_FEE_NOTE =
  "A late fee may apply under the terms of our agreement. Please check your contract for the rate.";

/**
 * Fill placeholders, then append the disclosure and opt-out footer.
 *
 * The footer is appended here rather than stored in the template so a user
 * cannot accidentally edit it away.
 */
export function renderTemplate(
  tpl: { subject: string; body: string },
  ctx: TemplateContext,
): { subject: string; body: string } {
  const vars: Record<string, string> = {
    clientName: ctx.clientName,
    freelancerName: ctx.freelancerName,
    invoiceNumber: ctx.invoiceNumber,
    amount: ctx.amount,
    dueDate: ctx.dueDate,
    daysOverdue: String(ctx.daysOverdue),
    lateFeeNote: ctx.lateFeeNote || DEFAULT_LATE_FEE_NOTE,
  };

  const fill = (s: string) =>
    s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) =>
      key in vars ? vars[key] : m,
    );

  const footer = [
    "",
    "---",
    `Automated invoice reminder sent on behalf of ${ctx.freelancerName} via ${ctx.appName}.`,
    `Not paid? Ignore these reminders: ${ctx.optOutUrl}`,
  ].join("\n");

  return { subject: fill(tpl.subject), body: fill(tpl.body) + footer };
}

export function amountFor(invoice: Invoice): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoice.currency,
  }).format(invoice.amountMinor / 100);
}
