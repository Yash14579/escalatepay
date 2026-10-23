"use client";

import { AppShell } from "@/components/app/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CURRENCIES } from "@/lib/currencies";
import { Globe, Palette, Clock, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <AppShell current="/settings">
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
              <p className="text-xs text-muted-foreground">Choose light, dark, or system</p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4" />
              Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Language</p>
                <p className="text-xs text-muted-foreground">Interface language</p>
              </div>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm" disabled>
                <option>English (en)</option>
                <option>Hindi (hi)</option>
                <option>Spanish (es)</option>
                <option>French (fr)</option>
                <option>Arabic (ar)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Default Currency</p>
                <p className="text-xs text-muted-foreground">For invoices and debtors</p>
              </div>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm" disabled>
                {CURRENCIES.map((c) => (
                  <option key={c.code}>{c.code} {c.symbol}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Currency & language preferences will save once connected to your account.</p>
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
                <p className="text-sm">Quiet hours</p>
                <p className="text-xs text-muted-foreground">Only send between 9 AM and 6 PM</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Reminder method</p>
                <p className="text-xs text-muted-foreground">Use your own WhatsApp/SMS/email</p>
              </div>
              <Badge variant="secondary">Tap to send</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              Senders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage email, WhatsApp, and SMS senders in the invoice flow. All use your own accounts.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
