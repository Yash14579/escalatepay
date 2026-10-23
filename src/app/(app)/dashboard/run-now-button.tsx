"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runDueNow, type RunResult } from "@/lib/data/run-now";

/**
 * Manual trigger for the reminder run, so testing does not mean waiting for
 * the scheduled job. It does exactly what the cron job does, no more.
 */
export function RunNowButton({ dueCount }: { dueCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RunResult | null>(null);

  const run = () => {
    startTransition(async () => {
      const r = await runDueNow();
      setResult(r);
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <Button size="sm" variant="outline" onClick={run} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PlayCircle className="size-4" />
        )}
        {pending ? "Running..." : "Run due check now"}
        {dueCount > 0 && !pending ? ` (${dueCount})` : ""}
      </Button>

      {result && (
        <div
          className={
            "rounded-md border px-3 py-2 text-xs " +
            (result.ok
              ? "border-border bg-secondary/40"
              : "border-destructive/40 bg-[color-mix(in_oklch,var(--destructive)_8%,transparent)]")
          }
        >
          <p className="font-medium">{result.message}</p>
          {result.details.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {result.details.slice(0, 6).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          {result.waiting > 0 && (
            <p className="mt-1 text-muted-foreground">
              People waiting need one tap, or turn on auto-send with a bridge
              connected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
