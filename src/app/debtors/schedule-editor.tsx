"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateDebtorSchedule } from "@/lib/data/debtors";
import type { Debtor } from "@/lib/debtors/types";

/**
 * Inline editor for a person's reminder rhythm.
 *
 * Everything here is per person, so one client can get a nudge every week
 * while another waits a month.
 */
export function ScheduleEditor({
  debtor,
  onClose,
}: {
  debtor: Debtor;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [interval, setIntervalDays] = useState(String(debtor.reminder_interval_days));
  const [timeOfDay, setTimeOfDay] = useState(debtor.reminder_time);
  const [maxReminders, setMaxReminders] = useState(String(debtor.max_reminders));
  const [autoSend, setAutoSend] = useState(debtor.auto_send);
  const [message, setMessage] = useState(debtor.reminder_message ?? "");

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateDebtorSchedule(debtor.id, {
          reminder_interval_days: Number(interval),
          reminder_time: timeOfDay,
          max_reminders: Number(maxReminders),
          auto_send: autoSend,
          reminder_message: message.trim() ? message : null,
        });
        router.refresh();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  return (
    <div className="mt-3 space-y-3 rounded-lg border bg-secondary/30 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Remind every (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={interval}
            onChange={(e) => setIntervalDays(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">At what time</span>
          <input
            type="time"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Stop after this many</span>
          <input
            type="number"
            min={1}
            max={50}
            value={maxReminders}
            onChange={(e) => setMaxReminders(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-end gap-2 pb-1.5">
          <input
            type="checkbox"
            checked={autoSend}
            onChange={(e) => setAutoSend(e.target.checked)}
            className="size-4"
          />
          <span className="text-sm">
            Send automatically
            <span className="block text-[11px] text-muted-foreground">
              Needs a connected WhatsApp bridge
            </span>
          </span>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">
          Your message. Use {"{{name}}"}, {"{{amount}}"}, {"{{reason}}"}
        </span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave empty to use the standard wording"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save timing"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
