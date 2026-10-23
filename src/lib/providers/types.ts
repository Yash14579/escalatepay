import type { Channel, OutboundMessage, SendResult } from "@/lib/types";

/**
 * Every way of sending sits behind this interface, so the engine never knows
 * or cares which one is active.
 *
 * "Tap to send" providers deliberately return a deep link instead of sending.
 * That is the zero-risk path: the message goes out from the user's own phone
 * and their own account, and nothing can get banned or billed by us.
 */
export interface MessageProvider {
  readonly id: string;
  readonly channel: Channel;
  readonly label: string;
  /** Short plain-English line shown in settings. */
  readonly blurb: string;
  /**
   * automatic = our server delivers it on schedule, no user action.
   * assisted  = we prepare it, the user taps to send from their own phone.
   */
  readonly mode: "automatic" | "assisted";
  /** True when this provider is usable without extra setup. */
  readonly requiresSetup: boolean;
  /** Warn before the user turns this on, when there is real risk. */
  readonly warning?: string;

  send(msg: OutboundMessage): Promise<SendResult>;
}

/** Builds the tap-to-send links. Pure functions, no network. */
export function smsDeepLink(phoneE164: string, body: string): string {
  return `sms:${phoneE164}?body=${encodeURIComponent(body)}`;
}

export function whatsappDeepLink(phoneE164: string, body: string): string {
  const digits = phoneE164.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export function mailtoDeepLink(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
