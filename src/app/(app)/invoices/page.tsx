import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_INVOICES, sentStepsFor } from "@/lib/demo";
import { nextStep, stepDueAt, STEP_LABEL } from "@/lib/engine/schedule";
import { amountFor } from "@/lib/engine/templates";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function InvoicesPage() {
  const now = new Date();
  return (
    <AppShell current="/invoices">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-sm text-muted-foreground">
              Every invoice and where it stands in its sequence.
            </p>
          </div>
          <Button size="sm" disabled title="Available once Supabase is connected">
            <Plus className="size-4" />
            New
          </Button>
        </div>

        <div className="space-y-3">
          {DEMO_INVOICES.map((inv) => {
            const sent = sentStepsFor(inv.id);
            const step = nextStep(inv, sent, now);
            const total = Object.keys(inv.schedule).length;
            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="block rounded-xl border p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{inv.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.recipient.name} · due {fmt(new Date(inv.dueAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {amountFor(inv)}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {inv.status}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {Object.keys(inv.schedule).map((s, idx) => {
                    const stepKey = s as keyof typeof inv.schedule;
                    const isSent = sent.includes(stepKey);
                    const isNext = step === stepKey;
                    return (
                      <div key={s} className="flex flex-1 items-center gap-1.5">
                        <div
                          className={
                            "h-1.5 flex-1 rounded-full " +
                            (isSent
                              ? "bg-primary"
                              : isNext
                                ? "bg-warning"
                                : "bg-border")
                          }
                          title={`${STEP_LABEL[stepKey]} · ${fmt(stepDueAt(inv, stepKey))}`}
                        />
                        {idx === 3 && null}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {sent.length} of {total} sent
                  {step ? ` · next ${STEP_LABEL[step].toLowerCase()} on ${fmt(stepDueAt(inv, step))}` : ""}
                  {inv.status === "paid" ? " · closed" : ""}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Adding invoices switches on when the database is connected. The demo
          data above is sample only.
        </div>
      </div>
    </AppShell>
  );
}
