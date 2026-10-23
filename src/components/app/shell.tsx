import Link from "next/link";
import { FileText, LayoutDashboard, Receipt, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/contracts", label: "ClauseCheck", icon: FileText },
  { href: "/settings", label: "Senders", icon: Settings },
];

export function AppShell({
  children,
  current,
}: {
  children: React.ReactNode;
  current: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              EP
            </span>
            <span className="text-sm font-semibold tracking-tight">
              EscalatePay
            </span>
          </Link>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            Sample data
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <nav className="hidden w-44 shrink-0 sm:block">
            <ul className="space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      current === href
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur sm:hidden">
        <ul className="mx-auto flex max-w-md">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                  current === href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
