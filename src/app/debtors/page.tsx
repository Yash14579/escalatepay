import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDebtors } from "@/lib/data/debtors";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currencies";
import { DebtorActions } from "./actions/debtor-actions";

export const dynamic = "force-dynamic";

export default async function DebtorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const debtors = user ? await getDebtors() : [];

  const totalOwed = debtors
    .filter((d: any) => d.status !== "paid")
    .reduce((sum: number, d: any) => sum + (d.amount_minor - (d.amount_paid_minor || 0)), 0);

  const currency = debtors[0]?.currency || "USD";

  return (
    <AppShell current="/debtors">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">People who owe me</h1>
            <p className="text-sm text-muted-foreground">Track and remind them on WhatsApp</p>
          </div>
          {user ? (
            <Button asChild size="sm">
              <Link href="/debtors/new"><Plus className="size-4" />Add person</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in to add</Link>
            </Button>
          )}
        </div>

        {user && (
          <Card className="py-4">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total outstanding</p>
                <p className="text-2xl font-semibold tracking-tight">{formatCurrency(totalOwed, currency)}</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-5" />
                <span className="text-sm">{debtors.filter((d: any) => d.status !== "paid").length} people</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!user ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Sign in to track people who owe you money</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        ) : debtors.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No one added yet</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/debtors/new">Add your first person</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {debtors.map((debtor: any) => {
              const remaining = debtor.amount_minor - (debtor.amount_paid_minor || 0);
              const statusColors: any = {
                pending: "outline",
                reminded: "secondary",
                partial: "warning",
                paid: "success",
              };
              return (
                <Card key={debtor.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{debtor.name}</p>
                          <Badge variant={statusColors[debtor.status]} className="capitalize">{debtor.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{debtor.phone}</p>
                        {debtor.reason && <p className="mt-1 text-xs text-muted-foreground">{debtor.reason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(remaining, debtor.currency)}</p>
                        {debtor.amount_paid_minor > 0 && debtor.status !== "paid" && (
                          <p className="text-xs text-muted-foreground">Paid: {formatCurrency(debtor.amount_paid_minor, debtor.currency)}</p>
                        )}
                      </div>
                    </div>
                    <DebtorActions debtor={debtor} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
