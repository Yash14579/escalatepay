import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_INVOICES } from "@/lib/demo";
import { amountFor } from "@/lib/engine/templates";
import { getInvoices } from "@/lib/data/invoices";
import { getDebtors } from "@/lib/data/debtors";
import { isReminderDue } from "@/lib/debtors/types";
import { createClient } from "@/lib/supabase/server";
import { RunNowButton } from "./run-now-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" />Paid</Badge>;
  if (status === "armed") return <Badge variant="secondary">Armed</Badge>;
  if (status === "paused") return <Badge variant="warning" className="gap-1"><Clock className="size-3" />Paused</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

const money0 = (minor: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const invoices = user ? await getInvoices() : DEMO_INVOICES;
  const isDemo = !user;

  const debtors = user ? await getDebtors() : [];
  const dueDebtors = debtors.filter((d) => isReminderDue(d, new Date())).length;

  const armed = invoices.filter((i: any) => i.status === "armed");
  const paused = invoices.filter((i: any) => i.status === "paused");
  const paid = invoices.filter((i: any) => i.status === "paid");

  const outstanding = [...armed, ...paused].reduce((s: number, i: any) => s + (isDemo ? i.amountMinor : i.amount_minor), 0);
  const collected = paid.reduce((s: number, i: any) => s + (isDemo ? i.amountMinor : i.amount_minor), 0);

  return (
    <AppShell current="/dashboard">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user ? "Your overview" : "Sample overview"}</p>
          </div>
          {user ? (
            <Button asChild size="sm"><Link href="/invoices/new">New invoice</Link></Button>
          ) : (
            <Button asChild size="sm" variant="outline"><Link href="/login">Sign in</Link></Button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="py-4"><CardContent className="space-y-1"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-2xl font-semibold tracking-tight">{user ? money0(outstanding) : money0(outstanding)}</p><p className="text-xs text-muted-foreground">{armed.length} armed, {paused.length} paused</p></CardContent></Card>
          <Card className="py-4"><CardContent className="space-y-1"><p className="text-xs text-muted-foreground">Invoices</p><p className="text-2xl font-semibold tracking-tight">{invoices.length}</p><p className="text-xs text-muted-foreground">{isDemo ? "demo" : "live"}</p></CardContent></Card>
          <Card className="py-4"><CardContent className="space-y-1"><p className="text-xs text-muted-foreground">Collected</p><p className="text-2xl font-semibold tracking-tight">{money0(collected)}</p><p className="text-xs text-muted-foreground">{paid.length} paid</p></CardContent></Card>
        </div>

        {user && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  People who owe you
                </p>
                <p className="text-xs text-muted-foreground">
                  {dueDebtors === 0
                    ? "Nobody is due a reminder right now."
                    : `${dueDebtors} ${dueDebtors === 1 ? "person is" : "people are"} due a reminder.`}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/debtors">Open</Link>
              </Button>
            </div>
            <RunNowButton dueCount={dueDebtors} />
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Invoices</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/invoices">View all</Link></Button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv: any) => {
              const name = isDemo ? inv.recipient.name : inv.recipient_name;
              const number = inv.number;
              const amount = isDemo ? amountFor(inv) : money0(inv.amount_minor, inv.currency);
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{number}</span>
                      <StatusBadge status={inv.status} />
                      {!user && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{name}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{amount}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
