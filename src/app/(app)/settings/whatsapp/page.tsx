import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Check } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getBridge } from "@/lib/data/bridges";
import { BRIDGE_PRESETS } from "@/lib/bridges/presets";
import { BridgeForm } from "./bridge-form";

export const dynamic = "force-dynamic";

export default async function WhatsAppSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const smsBridge = user ? await getBridge("sms") : null;
  const waBridge = user ? await getBridge("whatsapp") : null;

  return (
    <AppShell current="/settings">
      <div className="space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Settings
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect auto-send
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste your bridge details here and reminders can go out by
            themselves. Nothing to configure in Vercel.
          </p>
        </div>

        {!user && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to connect a bridge.
            </CardContent>
          </Card>
        )}

        {user && (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    SMS through your Android phone
                  </CardTitle>
                  <Badge variant="success">Free</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Your phone sends the texts through its own SIM and your own
                  recharge. No SMS API account, no per-message fee, no ban risk.
                </p>

                <ol className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    "On an Android phone with an active SIM, install SMS Gateway for Android from sms-gate.app.",
                    "Open the app, turn on Cloud Server, and press Start.",
                    "The app shows a username and password. Copy them into the boxes below.",
                    "Press Save, then Test connection, then Send test to your own phone.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-2">
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-medium text-foreground">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="rounded-md bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Want to keep it free</p>
                  <p className="mt-0.5">
                    Use the app pointed at its own private server, or the public
                    cloud server as documented. Check the current terms at{" "}
                    <span className="font-mono text-[11px]">sms-gate.app/pricing</span>{" "}
                    before you rely on it for a lot of messages. I have not
                    confirmed that the public cloud server stays free at high
                    volume.
                  </p>
                </div>

                <BridgeForm kind="sms" existing={smsBridge} />

                <a
                  href={BRIDGE_PRESETS.sms_gateway.doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  <BookOpen className="size-3.5" />
                  Official setup guide
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">WhatsApp through WAHA</CardTitle>
                  <Badge variant="warning">Ban risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 rounded-md border border-warning/40 bg-[color-mix(in_oklch,var(--warning)_8%,transparent)] p-2.5 text-xs">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <div className="text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Read this before you connect
                    </p>
                    <p className="mt-0.5">
                      WAHA drives WhatsApp through an unofficial client.
                      WhatsApp&apos;s terms do not allow it and they do ban
                      numbers for it. Use a spare number, warm it up slowly, and
                      keep volume low. Never link the number your clients use to
                      reach you.
                    </p>
                  </div>
                </div>

                <ol className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    "Run WAHA somewhere always on (Docker on a small server, or a PC you leave running).",
                    "Open its dashboard, start a session, and scan the QR with the spare number.",
                    "Expose it to the internet, for example with a free Cloudflare tunnel.",
                    "Paste the address and API key below, then test.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-2">
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-medium text-foreground">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <BridgeForm kind="whatsapp" existing={waBridge} />

                <a
                  href={BRIDGE_PRESETS.waha.doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  <BookOpen className="size-3.5" />
                  WAHA send-message docs
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 py-4 text-xs text-muted-foreground">
                <p className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  Without a bridge, every person still works with one-tap
                  sending. Nothing breaks.
                </p>
                <p className="flex items-start gap-1.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  Credentials are stored against your account and only readable
                  by you. They are never shown back in full.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
