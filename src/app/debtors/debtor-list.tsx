"use client";

import { useState } from "react";
import { DebtorCard } from "./debtor-card";
import { ScheduleEditor } from "./schedule-editor";
import type { Debtor } from "@/lib/debtors/types";

export function DebtorList({
  debtors,
  messages,
  dueIds,
}: {
  debtors: Debtor[];
  messages: Record<string, string>;
  dueIds: string[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {debtors.map((d) => (
        <div key={d.id}>
          <DebtorCard
            debtor={d}
            message={messages[d.id] ?? ""}
            due={dueIds.includes(d.id)}
            onEdit={() => setEditing(editing === d.id ? null : d.id)}
          />
          {editing === d.id && (
            <ScheduleEditor debtor={d} onClose={() => setEditing(null)} />
          )}
        </div>
      ))}
    </div>
  );
}
