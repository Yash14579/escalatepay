import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <div className="max-w-2xl space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Email, WhatsApp and SMS, from your own accounts
        </div>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          Get paid on time
          <br />
          without chasing anyone.
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
          EscalatePay reads your contract for red flags before you sign, then
          runs a calm, timed nudge sequence on unpaid invoices. You arm it once.
          It does the rest.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Open the demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contracts">Scan a contract</Link>
          </Button>
        </div>
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-4 border-t pt-6 text-left">
          {[
            ["Day 3", "Friendly reminder"],
            ["Day 7", "Firm follow-up"],
            ["Day 30", "Formal demand"],
          ].map(([d, label]) => (
            <div key={d}>
              <p className="text-xs font-medium">{d}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
