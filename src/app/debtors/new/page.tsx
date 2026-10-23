"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDebtor } from "@/lib/data/debtors";
import { CURRENCIES } from "@/lib/currencies";

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
          <h1 className="text-2xl font-semibold tracking-tight">Add person who owes you</h1>
          <p className="text-sm text-muted-foreground">Track and remind them on WhatsApp with one tap.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input name="name" placeholder="John Doe" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Phone number (with country code)</label>
                  <input name="phone" placeholder="+1234567890" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Amount owed</label>
                  <input name="amount" type="number" step="0.01" placeholder="1000" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Currency</label>
                  <select name="currency" defaultValue="USD" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Reason (optional)</label>
                <input name="reason" placeholder="Lunch money, rent share, etc." className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Due date (optional)</label>
                <input name="due_date" type="date" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add person"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
