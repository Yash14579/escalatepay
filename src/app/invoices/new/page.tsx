"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice } from "@/lib/data/invoices";

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const inv = await createInvoice(formData);
      router.push(`/invoices/${inv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  };

  return (
    <AppShell current="/invoices">
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
          <p className="text-sm text-muted-foreground">Add a client and due date. You can arm it after.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Invoice number</label>
                  <input name="number" placeholder="INV-1045" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <input name="amount" type="number" step="0.01" placeholder="2400" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Currency</label>
                  <input name="currency" defaultValue="USD" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Due date</label>
                  <input name="due_at" type="date" required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Client name</label>
                <input name="recipient_name" placeholder="Acme Co." required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Client email</label>
                  <input name="recipient_email" type="email" placeholder="billing@acme.com" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Client phone (optional)</label>
                  <input name="recipient_phone" placeholder="+15551234567" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Time zone</label>
                <input name="recipient_timezone" defaultValue="America/New_York" className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create invoice"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
