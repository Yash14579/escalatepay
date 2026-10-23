"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setInvoiceStatus } from "@/lib/data/invoices";
import { PauseCircle, PlayCircle, CheckCircle2 } from "lucide-react";

export function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const act = (s: "armed" | "paused" | "paid") => {
    startTransition(async () => {
      await setInvoiceStatus(id, s);
      router.refresh();
    });
  };

  if (status === "armed") {
    return (
      <Button variant="outline" size="sm" disabled={pending} onClick={() => act("paused")}>
        <PauseCircle className="size-4" />
        {pending ? "Pausing..." : "Pause this invoice"}
      </Button>
    );
  }
  if (status === "paid") {
    return null;
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => act("armed")}>
        <PlayCircle className="size-4" />
        {pending ? "Arming..." : "Arm it"}
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => act("paid")}>
        <CheckCircle2 className="size-4" />
        Mark paid
      </Button>
    </div>
  );
}
