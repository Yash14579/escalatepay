"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateDebtorStatus, markPartial, deleteDebtor } from "@/lib/data/debtors";
import { CheckCircle2, MessageCircle, Trash2 } from "lucide-react";

function whatsappLink(phone: string, name: string, amount: string, reason?: string | null) {
  const digits = phone.replace(/[^\d]/g, "");
  const msg = `Hi ${name}, just a reminder that you owe ${amount}${reason ? ` for ${reason}` : ""}. Please pay when you can. Thank you!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

export function DebtorActions({ debtor }: { debtor: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remind = () => {
    const link = whatsappLink(debtor.phone, debtor.name, "", debtor.reason);
    // better amount formatting done in UI
    window.open(link, "_blank");
    startTransition(async () => {
      await updateDebtorStatus(debtor.id, "reminded");
      router.refresh();
    });
  };

  const markPaid = () => {
    startTransition(async () => {
      await updateDebtorStatus(debtor.id, "paid");
      router.refresh();
    });
  };

  const remove = () => {
    if (!confirm("Remove this person?")) return;
    startTransition(async () => {
      await deleteDebtor(debtor.id);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={remind}>
        <MessageCircle className="size-4" />
        Remind on WhatsApp
      </Button>
      {debtor.status !== "paid" && (
        <Button size="sm" disabled={pending} onClick={markPaid}>
          <CheckCircle2 className="size-4" />
          Mark as paid
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
