import { AlertTriangle, FileText, ShieldCheck, Upload } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAMPLE_FLAGS = [
  {
    severity: "high" as const,
    title: "Payment due in 90 days",
    quote: "Payment will be made net ninety (90) days from receipt of invoice.",
    why: "Longer than most freelance work can absorb. Cash leaves your business months before it returns.",
    counter:
      "Payment is due 14 days from invoice date. A late fee of 1.5% per month applies to overdue balances.",
  },
  {
    severity: "high" as const,
    title: "All intellectual property transfers on payment",
    quote: "All deliverables and associated IP shall vest in the Client.",
    why: "If payment is late, ownership of the work is already gone.",
    counter:
      "IP shall vest in the Client on receipt of full payment. Until then, the Contractor retains all right, title and interest.",
  },
  {
    severity: "medium" as const,
    title: "Unlimited liability, and one-sided",
    quote: "Contractor shall indemnify the Client for any and all losses.",
    why: "Your risk has no ceiling. Theirs is capped.",
    counter:
      "Each party's total liability is limited to the fees paid under this agreement.",
  },
  {
    severity: "medium" as const,
    title: "Client may terminate at any time",
    quote: "Client may terminate at any time without cause.",
    why: "You can be cut off with no notice and no kill fee.",
    counter:
      "Client may terminate with 14 days written notice. Work completed up to that date is payable in full.",
  },
];

const severityStyle = {
  high: { variant: "destructive" as const, label: "Serious" },
  medium: { variant: "warning" as const, label: "Watch" },
};

export default function ContractsPage() {
  return (
    <AppShell current="/contracts">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ClauseCheck</h1>
          <p className="text-sm text-muted-foreground">
            Upload a contract before you sign it. We flag the clauses that cost
            you money and hand you replacement wording.
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-secondary">
              <Upload className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload a contract PDF</p>
              <p className="text-xs text-muted-foreground">
                Text based PDFs only. Scanned images arrive with the AI pass.
              </p>
            </div>
            <Button size="sm" disabled title="Enabled once the database step is done">
              Choose file
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-lg border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" />
          Contracts stay private to your account and are never used to train
          anything. Nothing leaves your account.
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">What a scan looks like</h2>
            <Badge variant="outline" className="text-[10px]">
              Sample result
            </Badge>
          </div>
          <div className="space-y-3">
            {SAMPLE_FLAGS.map((flag) => {
              const s = severityStyle[flag.severity];
              return (
                <Card key={flag.title}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle
                          className={
                            "size-3.5 " +
                            (flag.severity === "high"
                              ? "text-destructive"
                              : "text-warning")
                          }
                        />
                        {flag.title}
                      </CardTitle>
                      <Badge variant={s.variant} className="text-[10px]">
                        {s.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="border-l-2 pl-3 text-xs italic text-muted-foreground">
                      &ldquo;{flag.quote}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground">{flag.why}</p>
                    <div className="rounded-md bg-secondary/60 p-2.5">
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        <FileText className="size-3" />
                        Use this instead
                      </p>
                      <p className="text-xs">{flag.counter}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
