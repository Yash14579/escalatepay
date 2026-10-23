import Link from "next/link";
import { AlarmClock, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDebtors } from "@/lib/data/debtors";
import { databaseReady } from "@/lib/data/health";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currencies";
import {
  buildReminderMessage,
  isReminderDue,
  remainingMinor,
} from "@/lib/debtors/types";
import { DebtorList } from "./debtor-list";

export const dynamic = "force-dynamic";

export default async function DebtorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ready = user ? await databaseReady() : true;
  const debtors = user && ready ? await getDebtors() : [];

  const now = new Date();
  const active = debtors.filter((d) => d.status !== "paid");

  const dueIds = active.filter((d) => isReminderDue(d, now)).map((d) => d.id);

  // Totals are grouped by currency, because adding rupees to dollars is wrong.
  const totals = new Map<string, number>();
  for (const d of active) {
    totals.set(d.currency, (totals.get(d.currency) ?? 0) + remainingMinor(d));
  }

  const messages: Record<string, string> = {};
  for (const d of debtors) {
    messages[d.id] = buildReminderMessage(d, formatCurrency(remainingMinor(d), d.currency));
  }

  return (
    <AppShell current="/debtors">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">People who owe me</h1>
            <p className="text-sm text-muted-foreground">
              Each person has their own reminder rhythm.
            </p>
          </div>
          {user ? (
            <Button asChild size="sm">
              <Link href="/debtors/new">
                <Plus className="size-4" />
                Add person
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in to add</Link>
            </Button>
          )}
        </div>

        {user && !ready && (
          <Card className="border-warning/40 bg-[color-mix(in_oklch,var(--warning)_6%,transparent)]">
            <CardContent className="space-y-2 py-6 text-center">
              <p className="text-sm font-medium">Database setup needed</p>
              <p className="text-xs text-muted-foreground">
                In Supabase, open the SQL Editor and run, in order:
                supabase-schema.sql, supabase-debtor-reminders.sql and
                supabase-debtor-logs.sql. Then reload this page.
              </p>
            </CardContent>
          </Card>
        )}

        {user && ready && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="py-4">
              <CardContent className="space-y-1">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <div className="space-y-0.5">
                  {totals.size === 0 ? (
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(0, "USD")}
                    </p>
                  ) : (
                    [...totals.entries()].map(([cur, minor]) => (
                      <p key={cur} className="text-2xl font-semibold tracking-tight">
                        {formatCurrency(minor, cur)}
                      </p>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {active.length} {active.length === 1 ? "person" : "people"}
                </p>
              </CardContent>
            </Card>
            <Card className="py-4">
              <CardContent className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlarmClock className="size-3.5" />
                  Reminders due today
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {dueIds.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dueIds.length === 0
                    ? "Nothing to chase right now"
                    : "Send them below"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!user ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Users className="mx-auto mb-3 size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sign in to track people who owe you money.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        ) : debtors.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Users className="mx-auto mb-3 size-5 text-muted-foreground" />
              <p className="text-sm font-medium">No one here yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add someone you are owed money by, then set how often to nudge them.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/debtors/new">Add your first person</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {dueIds.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-[color-mix(in_oklch,var(--warning)_6%,transparent)] px-3 py-2 text-xs">
                <AlarmClock className="size-3.5 shrink-0 text-warning" />
                <span className="text-muted-foreground">
                  {dueIds.length === 1 ? "One person is" : `${dueIds.length} people are`} due a
                  reminder. They are marked below.
                </span>
              </div>
            )}
            <DebtorList debtors={debtors} messages={messages} dueIds={dueIds} />
            <p className="text-center text-xs text-muted-foreground">
              Messages open in your own WhatsApp, so you stay in control of what
              is sent and from which number.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
