"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteDebtor, recordReminderSent, updateDebtorStatus } from "@/lib/data/debtors";
import type { Debtor } from "@/lib/debtors/types";
import { formatCurrency } from "@/lib/currencies";

export function whatsappDeepLink(phone: string, body: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export function smsDeepLink(phone: string, body: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(body)}`;
}

export function DebtorCard({
  debtor,
  message,
  due,
  onEdit,
}: {
  debtor: Debtor;
  message: string;
  due: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remaining = debtor.amount_minor - (debtor.amount_paid_minor || 0);
  const money = formatCurrency(remaining, debtor.currency);
  const exhausted = debtor.reminder_count >= debtor.max_reminders;

  const sendWhatsApp = () => {
    window.open(whatsappDeepLink(debtor.phone, message), "_blank", "noopener");
    startTransition(async () => {
      try {
        await recordReminderSent(debtor.id, {
          channel: "whatsapp",
          body: message,
          outcome: "queued",
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const sendSms = () => {
    window.open(smsDeepLink(debtor.phone, message), "_blank", "noopener");
    startTransition(async () => {
      try {
        await recordReminderSent(debtor.id, {
          channel: "sms",
          body: message,
          outcome: "queued",
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const markPaid = () => {
    startTransition(async () => {
      try {
        await updateDebtorStatus(debtor.id, "paid");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const reopen = () => {
    startTransition(async () => {
      try {
        await updateDebtorStatus(debtor.id, "pending");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      try {
        await deleteDebtor(debtor.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove");
      }
    });
  };

  const statusVariant =
    debtor.status === "paid"
      ? "success"
      : debtor.status === "partial"
        ? "warning"
        : debtor.status === "reminded"
          ? "secondary"
          : "outline";

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{debtor.name}</p>
            <Badge variant={statusVariant} className="capitalize">
              {debtor.status}
            </Badge>
            {due && (
              <Badge variant="destructive" className="text-[10px]">
                Reminder due
              </Badge>
            )}
            {debtor.auto_send ? (
              <Badge variant="outline" className="text-[10px]">
                Auto
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                One tap
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{debtor.phone}</p>
          {debtor.reason && (
            <p className="mt-0.5 text-xs text-muted-foreground">{debtor.reason}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{money}</p>
          {debtor.amount_paid_minor > 0 && debtor.status !== "paid" && (
            <p className="text-xs text-muted-foreground">
              Paid {formatCurrency(debtor.amount_paid_minor, debtor.currency)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Every {debtor.reminder_interval_days}{" "}
          {debtor.reminder_interval_days === 1 ? "day" : "days"} at{" "}
          {debtor.reminder_time}
        </span>
        <span>
          {debtor.reminder_count} of {debtor.max_reminders} reminders sent
        </span>
        {debtor.status !== "paid" && (
          <span>
            {debtor.next_reminder_at
              ? `Next ${new Date(debtor.next_reminder_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`
              : exhausted
                ? "Reminders finished"
                : "No reminder scheduled"}
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {debtor.status !== "paid" && (
          <>
            <Button size="sm" disabled={pending} onClick={sendWhatsApp}>
              <MessageCircle className="size-4" />
              Send on WhatsApp
            </Button>
            {debtor.phone && (
              <Button size="sm" variant="outline" disabled={pending} onClick={sendSms}>
                <Send className="size-4" />
                SMS
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={pending} onClick={onEdit}>
              <ChevronDown className="size-4" />
              Timing
            </Button>
            <Button size="sm" disabled={pending} onClick={markPaid}>
              <CheckCircle2 className="size-4" />
              Paid
            </Button>
          </>
        )}
        {debtor.status === "paid" && (
          <Button size="sm" variant="outline" disabled={pending} onClick={reopen}>
            <Undo2 className="size-4" />
            Reopen
          </Button>
        )}
        {confirmDelete ? (
          <span className="flex items-center gap-2">
            <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            aria-label="Remove person"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
