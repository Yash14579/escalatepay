import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_INVOICES, sentStepsFor } from "@/lib/demo";
import { nextStep, STEP_LABEL } from "@/lib/engine/schedule";
import { amountFor } from "@/lib/engine/templates";


function StatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="size-3" /> Paid
      </Badge>
    );
  if (status === "armed") return <Badge variant="secondary">Armed</Badge>;
  if (status === "paused")
    return (
      <Badge variant="warning" className="gap-1">
        <Clock className="size-3" /> Paused
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

const money0 = (minor: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    minor / 100,
  );

export default function DashboardPage() {
  const now = new Date();

  const armed = DEMO_INVOICES.filter((i) => i.status === "armed");
  const paused = DEMO_INVOICES.filter((i) => i.status === "paused");
  const paid = DEMO_INVOICES.filter((i) => i.status === "paid");

  const outstanding = [...armed, ...paused].reduce((s, i) => s + i.amountMinor, 0);
  const dueNow = armed.filter((i) => nextStep(i, sentStepsFor(i.id), now));

  return (
    <AppShell current="/dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Who owes you what, and what happens next.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="py-4">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-semibold tracking-tight">{money0(outstanding)}</p>
              <p className="text-xs text-muted-foreground">{armed.length} armed, {paused.length} paused</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Action ready</p>
              <p className="text-2xl font-semibold tracking-tight">{dueNow.length}</p>
              <p className="text-xs text-muted-foreground">{dueNow.length === 1 ? "step waiting" : "steps waiting"}</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-2xl font-semibold tracking-tight">{money0(paid.reduce((s, i) => s + i.amountMinor, 0))}</p>
              <p className="text-xs text-muted-foreground">{paid.length} paid this cycle</p>
            </CardContent>
          </Card>
        </div>

        {dueNow.length > 0 && (
          <Card className="border-warning/40 bg-[color-mix(in_oklch,var(--warning)_6%,transparent)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-warning" />
                Ready to go out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dueNow.map((inv) => {
                const step = nextStep(inv, sentStepsFor(inv.id), now)!;
                return (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="font-medium">{inv.number}</span>{" "}
                      <span className="text-muted-foreground">{inv.recipient.name}, {STEP_LABEL[step].toLowerCase()}</span>
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/invoices/${inv.id}`}>
                        Review
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Invoices</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/invoices">View all</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {DEMO_INVOICES.map((inv) => {
              const sent = sentStepsFor(inv.id);
              const step = nextStep(inv, sent, now);
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{inv.number}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {inv.recipient.name} · {sent.length} of 4 sent
                      {step ? ` · next: ${STEP_LABEL[step].toLowerCase()}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{amountFor(inv)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
