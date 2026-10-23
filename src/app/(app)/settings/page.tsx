import { AlertTriangle, Check, Lock, Mail, MessageCircle, Smartphone } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDER_CATALOGUE } from "@/lib/providers/registry";
import type { Channel } from "@/lib/types";

const CHANNEL_META: Record<Channel, { label: string; icon: typeof Mail }> = {
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  sms: { label: "SMS", icon: Smartphone },
};

export default function SettingsPage() {
  const channels: Channel[] = ["email", "whatsapp", "sms"];

  return (
    <AppShell current="/settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">How your messages send</h1>
          <p className="text-sm text-muted-foreground">
            Pick where reminders go out from. Nothing is charged to you here, and
            we never ask for a developer key.
          </p>
        </div>

        {channels.map((channel) => {
          const Icon = CHANNEL_META[channel].icon;
          const options = PROVIDER_CATALOGUE.filter((p) => p.channel === channel);
          return (
            <Card key={channel}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4" />
                  {CHANNEL_META[channel].label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {options.map((p, idx) => (
                  <div
                    key={p.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{p.label}</span>
                          {idx === 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {p.mode === "automatic" ? "Automatic" : "One tap"}
                          </Badge>
                          {p.requiresSetup && (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <Lock className="size-2.5" />
                              Setup
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.blurb}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={idx === 0 ? "default" : "outline"}
                        disabled
                        title="Voice and persistence arrive with the database step"
                      >
                        {idx === 0 ? <Check className="size-3.5" /> : null}
                        {idx === 0 ? "In use" : "Choose"}
                      </Button>
                    </div>

                    {p.warning && (
                      <div className="mt-2 flex gap-2 rounded-md bg-[color-mix(in_oklch,var(--warning)_10%,transparent)] p-2 text-xs">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                        <span className="text-muted-foreground">{p.warning}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What every message includes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <p>Sent on your behalf, never as a collection agency.</p>
            <p>A one-click opt-out line, honoured immediately.</p>
            <p>Only between 9am and 6pm in the client&apos;s local time.</p>
            <p>Four messages at most, at least three days apart.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
