import type { Channel } from "@/lib/types";
import type { MessageProvider } from "@/lib/providers/types";

/**
 * The catalogue of every sender. Order matters: the first entry per channel is
 * the default shown to a new user, and the defaults are deliberately the ones
 * that need no setup and carry no risk.
 */
export interface ProviderDescriptor {
  id: string;
  channel: Channel;
  label: string;
  blurb: string;
  mode: "automatic" | "assisted";
  requiresSetup: boolean;
  warning?: string;
  /** False until credentials or a link exist for this account. */
  available: boolean;
}

export const PROVIDER_CATALOGUE: ProviderDescriptor[] = [
  {
    id: "email-platform",
    channel: "email",
    label: "EscalatePay sending address",
    blurb:
      "We send from our verified address. Replies go to your inbox. Nothing to set up.",
    mode: "automatic",
    requiresSetup: true,
    available: Boolean(process.env.RESEND_API_KEY),
  },
  {
    id: "email-own",
    channel: "email",
    label: "Your own email address",
    blurb:
      "Connect Gmail or Outlook. Reminders go from your own address.",
    mode: "automatic",
    requiresSetup: true,
    available: false,
  },
  {
    id: "whatsapp-tap",
    channel: "whatsapp",
    label: "WhatsApp, one tap to send",
    blurb:
      "We prepare it, you tap once. Sends from your own WhatsApp. No setup, no fees.",
    mode: "assisted",
    requiresSetup: false,
    available: true,
  },
  {
    id: "whatsapp-bridge",
    channel: "whatsapp",
    label: "WhatsApp, automatic (unofficial)",
    blurb: "Scan a QR once and it sends by itself from your own number.",
    mode: "automatic",
    requiresSetup: true,
    available: false,
    warning:
      "Not an official WhatsApp connection. They can ban the number you link.",
  },
  {
    id: "whatsapp-cloud",
    channel: "whatsapp",
    label: "WhatsApp Business API (official)",
    blurb: "Official route. Needs a Meta Business account and approved templates.",
    mode: "automatic",
    requiresSetup: true,
    available: false,
  },
  {
    id: "sms-tap",
    channel: "sms",
    label: "SMS, one tap to send",
    blurb:
      "We prepare the text, you tap once. Sends from your own SIM and plan.",
    mode: "assisted",
    requiresSetup: false,
    available: true,
  },
  {
    id: "sms-android-gateway",
    channel: "sms",
    label: "SMS, automatic through your Android phone",
    blurb: "Link an Android phone once and it sends through its SIM.",
    mode: "automatic",
    requiresSetup: true,
    available: false,
    warning:
      "Some carriers filter automated texts from personal SIMs, especially in India.",
  },
  {
    id: "sms-twilio",
    channel: "sms",
    label: "SMS through Twilio",
    blurb: "Cloud SMS. Needs A2P registration and pays per message.",
    mode: "automatic",
    requiresSetup: true,
    available: false,
  },
];

export function defaultProviderFor(channel: Channel): ProviderDescriptor {
  return PROVIDER_CATALOGUE.find((p) => p.channel === channel)!;
}

export type ProviderMap = Partial<Record<Channel, MessageProvider>>;
