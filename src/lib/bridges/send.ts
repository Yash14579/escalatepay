import "server-only";

/**
 * Sending through the user's own bridge.
 *
 * Two bridges are supported, and both are verified against their public docs:
 *
 * SMS, SMS Gateway for Android (sms-gate.app)
 *   POST https://api.sms-gate.app/3rdparty/v1/messages
 *   Auth: HTTP Basic, username and password shown in the phone app.
 *   Body: { textMessage: { text }, phoneNumbers: ["+91..."] }
 *
 * WhatsApp, WAHA
 *   POST {endpoint}/api/sendText
 *   Auth: header X-Api-Key
 *   Body: { session, chatId: "91...@c.us", text }
 */

export type BridgeKind = "whatsapp" | "sms";

export interface BridgeConfig {
  kind: BridgeKind;
  provider: "waha" | "sms_gateway";
  endpoint: string;
  auth_user: string | null;
  auth_secret: string | null;
  session_name: string | null;
}

export interface SendOutcome {
  ok: boolean;
  detail: string;
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : `+${digits}`;
}

/** Sends one message. Never throws; returns what happened. */
export async function sendViaBridge(
  bridge: BridgeConfig,
  to: string,
  text: string,
): Promise<SendOutcome> {
  if (!bridge.endpoint) {
    return { ok: false, detail: "No bridge address has been saved." };
  }

  try {
    if (bridge.provider === "sms_gateway") {
      const auth = Buffer.from(
        `${bridge.auth_user ?? ""}:${bridge.auth_secret ?? ""}`,
      ).toString("base64");

      const res = await fetch(bridge.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textMessage: { text },
          phoneNumbers: [normalizePhone(to)],
        }),
      });

      const body = await res.text().catch(() => "");
      if (!res.ok) {
        return {
          ok: false,
          detail: `The phone gateway refused it (${res.status}). ${body.slice(0, 200)}`,
        };
      }
      return { ok: true, detail: "Accepted by your phone. It sends from the SIM now." };
    }

    // WAHA
    const base = bridge.endpoint.replace(/\/$/, "");
    const chatId = `${to.replace(/[^\d]/g, "")}@c.us`;

    const res = await fetch(`${base}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bridge.auth_secret ? { "X-Api-Key": bridge.auth_secret } : {}),
      },
      body: JSON.stringify({
        session: bridge.session_name || "default",
        chatId,
        text,
      }),
    });

    const body = await res.text().catch(() => "");
    if (!res.ok) {
      return {
        ok: false,
        detail: `The WhatsApp bridge refused it (${res.status}). ${body.slice(0, 200)}`,
      };
    }
    return { ok: true, detail: "Accepted by WhatsApp." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return {
      ok: false,
      detail: `Could not reach the bridge. ${message}. Check the address is reachable from the internet.`,
    };
  }
}

/**
 * Read-only check that the bridge answers at all, without sending anything to
 * a real person. For SMS this hits the device list; for WAHA the session list.
 */
export async function pingBridge(bridge: BridgeConfig): Promise<SendOutcome> {
  if (!bridge.endpoint) {
    return { ok: false, detail: "No bridge address has been saved." };
  }
  try {
    if (bridge.provider === "sms_gateway") {
      const base = bridge.endpoint.replace(/\/messages.*$/, "");
      const auth = Buffer.from(
        `${bridge.auth_user ?? ""}:${bridge.auth_secret ?? ""}`,
      ).toString("base64");
      const res = await fetch(`${base}/devices`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.status === 401) {
        return { ok: false, detail: "The username or password was rejected." };
      }
      if (!res.ok) {
        return { ok: false, detail: `The gateway answered ${res.status}.` };
      }
      const devices = (await res.json().catch(() => [])) as unknown[];
      if (Array.isArray(devices) && devices.length === 0) {
        return {
          ok: false,
          detail: "The connection works, but no phone is linked to it yet.",
        };
      }
      return { ok: true, detail: "Your phone is linked and reachable." };
    }

    const base = bridge.endpoint.replace(/\/$/, "");
    const res = await fetch(`${base}/api/sessions`, {
      headers: bridge.auth_secret ? { "X-Api-Key": bridge.auth_secret } : {},
    });
    if (res.status === 401) {
      return { ok: false, detail: "The API key was rejected." };
    }
    if (!res.ok) {
      return { ok: false, detail: `The bridge answered ${res.status}.` };
    }
    const sessions = (await res.json().catch(() => [])) as {
      name?: string;
      status?: string;
    }[];
    const wanted = bridge.session_name || "default";
    const match = Array.isArray(sessions)
      ? sessions.find((s) => s.name === wanted)
      : undefined;
    if (!match) {
      return { ok: false, detail: `No session named "${wanted}" was found.` };
    }
    if (match.status !== "WORKING") {
      return {
        ok: false,
        detail: `Session "${wanted}" is ${match.status ?? "not connected"}. Scan the QR code again.`,
      };
    }
    return { ok: true, detail: "WhatsApp is linked and connected." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return { ok: false, detail: `Could not reach the bridge. ${message}` };
  }
}
