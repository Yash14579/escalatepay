import type { MessageProvider } from "@/lib/providers/types";
import type { OutboundMessage, SendResult } from "@/lib/types";
import { smsDeepLink } from "@/lib/providers/types";

/**
 * One-tap SMS. Opens the phone's own Messages app with the text filled in.
 * Sends from the user's own SIM and their own plan. Nothing for us to bill,
 * nothing for a carrier to block.
 */
export class SmsTapProvider implements MessageProvider {
  readonly id = "sms-tap";
  readonly channel = "sms" as const;
  readonly label = "SMS, one tap to send";
  readonly blurb =
    "We prepare the text. You tap once and your phone sends it from your own number and your own plan.";
  readonly mode = "assisted" as const;
  readonly requiresSetup = false;

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!msg.deepLink) {
      return { outcome: "failed", error: "No SMS link could be built." };
    }
    return { outcome: "queued", providerId: msg.deepLink };
  }

  static link(phoneE164: string, body: string): string {
    return smsDeepLink(phoneE164, body);
  }
}

/**
 * Android phone as the sender. The user installs a small companion app that
 * registers its own webhook, and our scheduler calls it to send through the
 * phone's SIM.
 *
 * Caveat worth knowing: carriers in India apply DLT filtering to automated
 * sender IDs, so messages from a personal SIM can be dropped without an error.
 */
export class AndroidSimGatewayProvider implements MessageProvider {
  readonly id = "sms-android-gateway";
  readonly channel = "sms" as const;
  readonly label = "SMS, automatic through your Android phone";
  readonly blurb =
    "Link an Android phone once and reminders send by themselves through its SIM.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;
  readonly warning =
    "Some carriers filter automated texts from personal SIMs, especially in India, and messages can be dropped silently. Test with your own number before arming real invoices.";

  constructor(
    private readonly baseUrl: string | null,
    private readonly username: string | null,
    private readonly password: string | null,
  ) {}

  get isConfigured() {
    return Boolean(this.baseUrl && this.username && this.password);
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.baseUrl || !this.username || !this.password) {
      return { outcome: "skipped", error: "No Android phone is linked." };
    }
    try {
      const auth = Buffer.from(
        `${this.username}:${this.password}`,
      ).toString("base64");
      const res = await fetch(
        `${this.baseUrl.replace(/\/$/, "")}/api/3rdparty/v1/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: msg.body,
            phoneNumbers: [msg.to.replace(/[^\d+]/g, "")],
          }),
        },
      );
      if (!res.ok) {
        return { outcome: "failed", error: `Gateway ${res.status}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { outcome: "sent", providerId: data.id };
    } catch (err) {
      return {
        outcome: "failed",
        error: err instanceof Error ? err.message : "Gateway send error",
      };
    }
  }
}

/**
 * Twilio, for anyone who already has an account. Needs a number, A2P 10DLC
 * registration for US traffic, and per-message billing on their side.
 */
export class TwilioSmsProvider implements MessageProvider {
  readonly id = "sms-twilio";
  readonly channel = "sms" as const;
  readonly label = "SMS through Twilio";
  readonly blurb =
    "Cloud SMS for existing Twilio accounts. Needs a US number with A2P registration and pays per message.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;

  constructor(
    private readonly accountSid: string | null,
    private readonly authToken: string | null,
    private readonly fromNumber: string | null,
  ) {}

  get isConfigured() {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return { outcome: "skipped", error: "Twilio is not configured." };
    }
    try {
      const body = new URLSearchParams({
        To: msg.to,
        From: this.fromNumber,
        Body: msg.body,
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { outcome: "failed", error: `Twilio ${res.status}: ${detail.slice(0, 300)}` };
      }
      const data = (await res.json()) as { sid?: string };
      return { outcome: "sent", providerId: data.sid };
    } catch (err) {
      return {
        outcome: "failed",
        error: err instanceof Error ? err.message : "Twilio send error",
      };
    }
  }
}
