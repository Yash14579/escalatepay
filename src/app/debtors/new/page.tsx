"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDebtor } from "@/lib/data/debtors";
import { CURRENCIES } from "@/lib/currencies";
import { DEBTOR_DEFAULTS } from "@/lib/debtors/types";

export default function NewDebtorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await createDebtor(formData);
      router.push("/debtors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
      setLoading(false);
    }
  };

  return (
    <AppShell current="/debtors">
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add someone who owes you
          </h1>
          <p className="text-sm text-muted-foreground">
            Set their reminder rhythm now, or change it any time.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who and how much</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-xs text-muted-foreground">Name</span>
                  <input
                    name="name"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs text-muted-foreground">
                    WhatsApp number, with country code
                  </span>
                  <input
                    name="phone"
                    required
                    placeholder="+919876543210"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-xs text-muted-foreground">Amount owed</span>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs text-muted-foreground">Currency</span>
                  <select
                    name="currency"
                    defaultValue="USD"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="block text-xs text-muted-foreground">
                  What is it for (optional)
                </span>
                <input
                  name="reason"
                  placeholder="Rent share, loan, design work"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>

              <label className="block space-y-1">
                <span className="block text-xs text-muted-foreground">
                  Due date (optional)
                </span>
                <input
                  name="due_date"
                  type="date"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>

              <div className="space-y-3 rounded-lg border bg-secondary/30 p-3">
                <p className="text-xs font-medium">Reminder timing</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="block text-xs text-muted-foreground">
                      Remind every (days)
                    </span>
                    <input
                      name="reminder_interval_days"
                      type="number"
                      min={1}
                      max={365}
                      defaultValue={DEBTOR_DEFAULTS.reminder_interval_days}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-muted-foreground">At what time</span>
                    <input
                      name="reminder_time"
                      type="time"
                      defaultValue={DEBTOR_DEFAULTS.reminder_time}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-muted-foreground">
                      Stop after this many
                    </span>
                    <input
                      name="max_reminders"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={DEBTOR_DEFAULTS.max_reminders}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs text-muted-foreground">Send by</span>
                    <select
                      name="reminder_channel"
                      defaultValue="whatsapp"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                    </select>
                  </label>
                  <label className="flex items-end gap-2 pb-2">
                    <input name="auto_send" type="checkbox" className="size-4" />
                    <span className="text-sm">
                      Send automatically
                      <span className="block text-[11px] text-muted-foreground">
                        Needs a connected bridge
                      </span>
                    </span>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="block text-xs text-muted-foreground">
                    Your message. Use {"{{name}}"}, {"{{amount}}"}, {"{{reason}}"}
                  </span>
                  <textarea
                    name="reminder_message"
                    rows={3}
                    placeholder="Leave empty to use the standard wording"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add person"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/debtors")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
