import type { MessageProvider } from "@/lib/providers/types";
import type { OutboundMessage, SendResult } from "@/lib/types";
import { mailtoDeepLink } from "@/lib/providers/types";

/**
 * Platform email. We send on the freelancer's behalf from our verified domain,
 * with Reply-To set to their own address so client replies land in their inbox
 * as if they had written it themselves.
 *
 * Needs: RESEND_API_KEY and a verified sending domain.
 */
export class PlatformEmailProvider implements MessageProvider {
  readonly id = "email-platform";
  readonly channel = "email" as const;
  readonly label = "EscalatePay sending address";
  readonly blurb =
    "We send from our own verified address, with replies going to your inbox. Nothing for you to set up.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
    private readonly appName = "EscalatePay",
  ) {}

  async send(msg: OutboundMessage): Promise<SendResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${msg.fromName} (Billing) via ${this.appName} <${this.fromAddress}>`,
          to: [msg.to],
          reply_to: msg.replyTo,
          subject: msg.subject ?? "(no subject)",
          text: msg.body,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { outcome: "failed", error: `Resend ${res.status}: ${detail.slice(0, 300)}` };
      }
      const data = (await res.json()) as { id?: string };
      return { outcome: "sent", providerId: data.id };
    } catch (err) {
      return {
        outcome: "failed",
        error: err instanceof Error ? err.message : "Unknown send error",
      };
    }
  }
}

/**
 * The user's own mailbox. Two ways in, both without developer keys:
 *   - Gmail/Outlook app password over SMTP
 *   - Gmail OAuth connection
 *
 * Network send is left to the SMTP layer so this stays free of provider
 * specific code; when not configured it degrades to a mailto tap link.
 */
export class OwnMailboxProvider implements MessageProvider {
  readonly id = "email-own";
  readonly channel = "email" as const;
  readonly label = "Your own email address";
  readonly blurb =
    "Connect Gmail or Outlook and reminders go out from your own address. Uses your mail provider's normal sending limits.";
  readonly mode = "automatic" as const;
  readonly requiresSetup = true;

  constructor(
    private readonly transport: {
      send(msg: OutboundMessage): Promise<SendResult>;
    } | null,
    private readonly ownAddress: string | null,
  ) {}

  get isConfigured() {
    return this.transport !== null && this.ownAddress !== null;
  }

  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.transport || !this.ownAddress) {
      return {
        outcome: "skipped",
        error: "Own mailbox is not connected yet.",
      };
    }
    return this.transport.send(msg);
  }

  /** Fallback that always works, no setup at all. */
  tapLink(msg: OutboundMessage, to: string): string {
    return mailtoDeepLink(to, msg.subject ?? "", msg.body);
  }
}
