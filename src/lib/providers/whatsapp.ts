import type { MessageProvider } from "@/lib/providers/types";
import type { OutboundMessage, SendResult } from "@/lib/types";
import { whatsappDeepLink } from "@/lib/providers/types";

/**
 * One-tap WhatsApp. Fully safe: the message opens in the user's own WhatsApp
 * and they press send. No unofficial client, no ban risk, no per-message fee.
 *
 * This is the default WhatsApp path for exactly that reason.
 */
export class WhatsappTapProvider implements MessageProvider {
  readonly id = "whatsapp-tap";
  readonly channel = "whatsapp" as const;
  readonly label = "WhatsApp, one tap to send";
  readonly blurb =
    "We prepare the message. You tap once and it sends from your own WhatsApp. No setup, no fees, no risk to your number.";
  readonly mode = "assisted" as const;
  readonly requiresSetup = false;

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!msg.deepLink) {
      return { outcome: "failed", error: "No WhatsApp link could be built." };
    }
    return { outcome: "queued", providerId: msg.deepLink };
  }

  static link(phoneE164: string, body: string): string {
    return whatsappDeepLink(phoneE164, body);
  }
}

/**
 * QR-linked WhatsApp Web bridge (WAHA, Evolution API, or Baileys style).
 *
 * WARNING: this drives WhatsApp through an unofficial client. WhatsApp's terms
 * forbid that and numbers do get banned. Off by default, and the connect screen
 * says so plainly.
 */
export class WhatsappBridgeProvider implements MessageProvider {
  readonly id = "whatsapp-bridge";
  readonly channel = "whatsapp" as const;
  readonly label = "WhatsApp, automatic (unofficial)";
  readonly blurb =
    "Scan a QR code once and your reminders send by themselves from your own number.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;
  readonly warning =
    "This is not an official WhatsApp connection. WhatsApp's terms do not allow it, and they can ban the number you link. Do not use your main business number.";

  constructor(
    private readonly endpoint: string | null,
    private readonly apiKey: string | null,
    private readonly sessionId: string | null,
  ) {}

  get isConfigured() {
    return Boolean(this.endpoint && this.sessionId);
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.endpoint || !this.sessionId) {
      return { outcome: "skipped", error: "WhatsApp bridge is not linked." };
    }
    try {
      const res = await fetch(
        `${this.endpoint.replace(/\/$/, "")}/api/sendText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey ? { "X-Api-Key": this.apiKey } : {}),
          },
          body: JSON.stringify({
            session: this.sessionId,
            chatId: `${msg.to.replace(/[^\d]/g, "")}@c.us`,
            text: msg.body,
          }),
        },
      );
      if (!res.ok) {
        return { outcome: "failed", error: `Bridge ${res.status}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { outcome: "sent", providerId: data.id };
    } catch (err) {
      return {
        outcome: "failed",
        error: err instanceof Error ? err.message : "Bridge send error",
      };
    }
  }
}

/**
 * Official Meta Cloud API. Requires a Meta Business portfolio, a verified
 * sender, pre-approved UTILITY templates, and per-message billing. Built as a
 * slot for users who already have it.
 */
export class WhatsappCloudProvider implements MessageProvider {
  readonly id = "whatsapp-cloud";
  readonly channel = "whatsapp" as const;
  readonly label = "WhatsApp Business API (official)";
  readonly blurb =
    "The official route, for businesses that already have a Meta Business account and approved templates.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;

  constructor(
    private readonly phoneNumberId: string | null,
    private readonly accessToken: string | null,
    private readonly templateName: string | null,
  ) {}

  get isConfigured() {
    return Boolean(this.phoneNumberId && this.accessToken && this.templateName);
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return { outcome: "skipped", error: "WhatsApp Cloud API is not configured." };
    }
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: msg.to.replace(/[^\d]/g, ""),
            type: "text",
            text: { preview_url: false, body: msg.body },
          }),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { outcome: "failed", error: `Meta ${res.status}: ${detail.slice(0, 300)}` };
      }
      const data = (await res.json().catch(() => ({}))) as {
        messages?: { id?: string }[];
      };
      return { outcome: "sent", providerId: data.messages?.[0]?.id };
    } catch (err) {
      return {
        outcome: "failed",
        error: err instanceof Error ? err.message : "Meta send error",
      };
    }
  }
}
