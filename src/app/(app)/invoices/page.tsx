import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { DEMO_INVOICES, sentStepsFor } from "@/lib/demo";
import { nextStep, stepDueAt, STEP_LABEL } from "@/lib/engine/schedule";
import { amountFor } from "@/lib/engine/templates";
import { getInvoices } from "@/lib/data/invoices";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtMoney = (minor: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date();
  const invoices = user ? await getInvoices() : DEMO_INVOICES;

  return (
    <AppShell current="/invoices">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">{user ? "Your invoices" : "Sample invoices"}</p>
          </div>
          {user ? (
            <Button asChild size="sm">
              <Link href="/invoices/new"><Plus className="size-4" />New</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in to create</Link>
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {invoices.map((inv: any) => {
            const isDemo = !user;
            const sent = isDemo ? sentStepsFor(inv.id) : [];
            const step = isDemo ? nextStep(inv, sent, now) : null;
            const total = isDemo ? Object.keys(inv.schedule).length : 4;
            const due = isDemo ? new Date(inv.dueAt) : new Date(inv.due_at);
            const number = inv.number;
            const name = isDemo ? inv.recipient.name : inv.recipient_name;
            const status = inv.status;
            const amount = isDemo ? amountFor(inv) : fmtMoney(inv.amount_minor, inv.currency);

            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block rounded-xl border p-4 transition-colors hover:bg-secondary/40">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{number}</p>
                    <p className="text-xs text-muted-foreground">{name} · due {fmt(due)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{amount}</p>
                    <p className="text-xs capitalize text-muted-foreground">{status}</p>
                  </div>
                </div>
                {isDemo && (
                  <>
                    <div className="mt-3 flex items-center gap-1.5">
                      {Object.keys(inv.schedule).map((s) => {
                        const stepKey = s as any;
                        const isSent = sent.includes(stepKey);
                        const isNext = step === stepKey;
                        return <div key={s} className={"h-1.5 flex-1 rounded-full " + (isSent ? "bg-primary" : isNext ? "bg-warning" : "bg-border")} />;
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{sent.length} of {total} sent{step ? ` · next ${STEP_LABEL[step].toLowerCase()}` : ""}{status === "paid" ? " · closed" : ""}</p>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
