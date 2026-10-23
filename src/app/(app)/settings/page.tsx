"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CURRENCIES } from "@/lib/currencies";
import { Globe, Palette, Clock, MessageCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm">Theme</p>
            <p className="text-xs text-muted-foreground">Light, dark, or follow your system</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="size-4" />
            WhatsApp and reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/whatsapp"
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-secondary/50"
          >
            <div>
              <p className="text-sm font-medium">How to connect WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                One tap, QR bridge, or the official business API. See the real
                costs and risks of each.
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4" />
            Language and region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Language</p>
              <p className="text-xs text-muted-foreground">Interface language</p>
            </div>
            <select className="rounded-md border bg-background px-3 py-1.5 text-sm" disabled>
              <option>English (en)</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">Default currency</p>
              <p className="text-xs text-muted-foreground">
                Each invoice and person can still use their own
              </p>
            </div>
            <select className="rounded-md border bg-background px-3 py-1.5 text-sm" disabled>
              {CURRENCIES.map((c) => (
                <option key={c.code}>
                  {c.code} {c.symbol}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Real language switching and a saved default currency come next.
            Neither is wired to your account yet, so I have left them locked
            rather than showing you a control that does nothing.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Timing</p>
              <p className="text-xs text-muted-foreground">
                Set per person when you add them
              </p>
            </div>
            <Badge variant="secondary">Custom</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Sending method</p>
              <p className="text-xs text-muted-foreground">
                Default is one tap from your own phone
              </p>
            </div>
            <Badge variant="secondary">One tap</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Hard stop</p>
              <p className="text-xs text-muted-foreground">
                Reminders stop automatically after the limit you set
              </p>
            </div>
            <Badge variant="secondary">Always on</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
