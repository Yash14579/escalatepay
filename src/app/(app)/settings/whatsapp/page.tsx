import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  KeyRound,
  QrCode,
  Smartphone,
} from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OPTIONS = [
  {
    id: "tap",
    name: "One tap to send",
    status: "works today",
    statusVariant: "success" as const,
    icon: Smartphone,
    setup: "Nothing. Zero minutes.",
    cost: "Free. Nothing to buy.",
    risk: "None. You send from your own WhatsApp, exactly like typing it yourself.",
    good:
      "You stay in full control of every message. No account, no approval, no ban risk.",
    bad:
      "It cannot send by itself. The app tells you who is due, and you press send.",
    steps: [
      "Open People who owe me.",
      "Find the person marked Reminder due.",
      "Press Send on WhatsApp.",
      "WhatsApp opens with the message already written. Press send there.",
    ],
  },
  {
    id: "bridge",
    name: "Scan a QR code, then fully automatic",
    status: "needs your own server",
    statusVariant: "warning" as const,
    icon: QrCode,
    setup: "About an hour, and a small always-on computer or server.",
    cost: "Free software. A VPS is about 5 to 8 dollars a month.",
    risk:
      "This uses an unofficial WhatsApp connection. WhatsApp's terms do not allow it, and they do ban numbers. Use a spare number, never your main business line.",
    good:
      "Once linked it sends by itself on your schedule, with no tapping.",
    bad:
      "You run and maintain a server. The number can be banned at any time.",
    steps: [
      "Get a small server (Hetzner, DigitalOcean, Railway, or a Raspberry Pi at home).",
      "Install a WhatsApp bridge tool such as WAHA or Evolution API on it.",
      "Open its dashboard and scan the QR code with the WhatsApp account you want to send from, the same way you link WhatsApp Web.",
      "Send me the bridge address and its API key, and I will set the three settings on this project.",
      "Turn on Send automatically for the people you want handled for you.",
    ],
  },
  {
    id: "cloud",
    name: "Official WhatsApp Business API",
    status: "business only",
    statusVariant: "outline" as const,
    icon: BadgeCheck,
    setup: "A few days. Meta has to verify a business.",
    cost:
      "A Meta business account, and a small fee for each message. Roughly 0.0034 dollars per utility message to a US number, 0.1150 rupees to an Indian number.",
    risk:
      "None from WhatsApp. This is the route they intend you to use.",
    good:
      "Fully supported, no ban risk, and it scales if this becomes a real product.",
    bad:
      "Needs a registered business, approved message templates, and per-message billing. Overkill for chasing a few friends or clients.",
    steps: [
      "Create a Meta Business portfolio and verify the business.",
      "Add a WhatsApp number you own to it.",
      "Submit each reminder wording as a utility template and wait for approval.",
      "Give me the phone number ID and access token, and I will connect it.",
    ],
  },
];

export default function WhatsAppGuidePage() {
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
            Connecting WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground">
            Three ways. Pick by how much automation you want versus how much
            risk you will accept.
          </p>
        </div>

        <Card className="border-warning/40 bg-[color-mix(in_oklch,var(--warning)_6%,transparent)]">
          <CardContent className="flex gap-2 py-4 text-xs">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="space-y-1 text-muted-foreground">
              <p className="font-medium text-foreground">
                Straight answer before you choose
              </p>
              <p>
                Automated messaging is regulated, and mass-reminding people who
                did not agree to it can get a number banned or, in the US, lead
                to per-message penalties.
              </p>
              <p>
                Whichever route you pick, this app caps reminders per person,
                stops when they are marked paid, and respects opt-outs.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Card key={opt.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="size-4" />
                      {opt.name}
                    </CardTitle>
                    <Badge variant={opt.statusVariant}>{opt.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <p className="font-medium">Setup time</p>
                      <p className="text-muted-foreground">{opt.setup}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cost</p>
                      <p className="text-muted-foreground">{opt.cost}</p>
                    </div>
                    <div>
                      <p className="font-medium">Risk</p>
                      <p className="text-muted-foreground">{opt.risk}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-md bg-secondary/50 p-2.5">
                      <p className="mb-1 font-medium">What is good</p>
                      <p className="text-muted-foreground">{opt.good}</p>
                    </div>
                    <div className="rounded-md bg-secondary/50 p-2.5">
                      <p className="mb-1 font-medium">What is the catch</p>
                      <p className="text-muted-foreground">{opt.bad}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium">How to set it up</p>
                    <ol className="space-y-1.5 text-xs text-muted-foreground">
                      {opt.steps.map((s, i) => (
                        <li key={s} className="flex gap-2">
                          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-medium text-foreground">
                            {i + 1}
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" />
              Where the settings live
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              On Vercel, open the project, then Settings, then Environment
              Variables. Add these three, and the app picks them up:
            </p>
            <ul className="space-y-1 font-mono text-[11px]">
              <li>WHATSAPP_BRIDGE_URL</li>
              <li>WHATSAPP_BRIDGE_KEY</li>
              <li>WHATSAPP_BRIDGE_SESSION</li>
            </ul>
            <p className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
              Never paste these keys into a chat or a GitHub file. Type them
              straight into Vercel.
            </p>
            <p className="pt-1">
              Until those are set, every person falls back to one-tap sending,
              which always works.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
