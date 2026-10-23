import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Mail, MessageCircle, Smartphone } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoice, getInvoices } from "@/lib/data/invoices";
import { STEP_LABEL, STEP_ORDER, nextStep, stepDueAt } from "@/lib/engine/schedule";
import { amountFor } from "@/lib/engine/templates";
import { DEMO_INVOICES, logsFor, sentStepsFor } from "@/lib/demo";
import { InvoiceActions } from "@/app/invoices/actions/invoice-actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const channelIcon = { email: Mail, whatsapp: MessageCircle, sms: Smartphone } as const;

const fmtMoney = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let invoice: any = null;
  let sent: string[] = [];
  let logs: any[] = [];

  if (user) {
    invoice = await getInvoice(id);
  }
  if (!invoice) {
    invoice = DEMO_INVOICES.find((i) => i.id === id);
    if (invoice) {
      sent = sentStepsFor(invoice.id) as any;
      logs = logsFor(invoice.id);
    }
  }

  if (!invoice) notFound();

  const now = new Date();
  const upcoming = nextStep(invoice as any, sent as any, now);

  return (
    <AppShell current="/invoices">
      <div className="space-y-5">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Invoices
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{invoice.number}</h1>
              <Badge variant={invoice.status === "armed" ? "secondary" : "outline"} className="capitalize">
                {invoice.status}
              </Badge>
              {!user && <Badge variant="outline">Demo</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{invoice.recipient_name ?? invoice.recipient?.name} · due {fmtDate(new Date(invoice.due_at ?? invoice.dueAt))}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums">{user ? fmtMoney(invoice.amount_minor, invoice.currency) : amountFor(invoice)}</p>
            <p className="text-xs text-muted-foreground">{invoice.currency}</p>
          </div>
        </div>

        {user && <InvoiceActions id={invoice.id} status={invoice.status} />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">The sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-5">
              {STEP_ORDER.map((step) => {
                const isSent = sent.includes(step);
                const isNext = upcoming === step;
                const due = user ? new Date(new Date(invoice.due_at).getTime() + invoice.schedule[step] * 86400000) : stepDueAt(invoice as any, step);
                const log = logs.find((l: any) => l.step === step);
                return (
                  <li key={step} className="relative">
                    <span className={"absolute -left-[26px] top-1 grid size-3 place-items-center rounded-full ring-4 ring-background " + (isSent ? "bg-primary" : isNext ? "bg-warning" : "bg-border")} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{STEP_LABEL[step]}</p>
                        <p className="text-xs text-muted-foreground">{isSent ? "Sent" : isNext ? "Due now" : `Scheduled ${fmtDate(due)}`}</p>
                      </div>
                      {log && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          {(() => { const Icon = channelIcon[log.channel as keyof typeof channelIcon]; return Icon ? <Icon className="size-3" /> : null; })()}
                          {log.channel}
                        </Badge>
                      )}
                    </div>
                    {log && <p className="mt-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground">{log.subject ?? ""}</p>}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message log</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? <p className="text-sm text-muted-foreground">{user ? "Nothing sent yet. Arm the invoice to start the sequence." : "Nothing sent yet in demo."}</p> : (
              <div className="space-y-3">
                {logs.map((log: any) => {
                  const Icon = channelIcon[log.channel as keyof typeof channelIcon];
                  return (
                    <div key={log.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium">{Icon && <Icon className="size-3.5" />}{log.channel} · {log.to}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{fmtDate(new Date(log.sentAt))}</span>
                      </div>
                      {log.subject && <p className="mt-1.5 text-sm font-medium">{log.subject}</p>}
                      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{log.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
