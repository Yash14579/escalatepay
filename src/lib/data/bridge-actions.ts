"use server";

import { createClient } from "@/lib/supabase/server";
import { pingBridge, sendViaBridge, type BridgeConfig } from "@/lib/bridges/send";
import { getBridge } from "@/lib/data/bridges";

export interface ActionResult {
  ok: boolean;
  message: string;
  detail?: string;
}

function toConfig(row: Record<string, unknown> | null): BridgeConfig | null {
  if (!row) return null;
  return {
    kind: row.kind as BridgeConfig["kind"],
    provider: row.provider as BridgeConfig["provider"],
    endpoint: String(row.endpoint ?? ""),
    auth_user: (row.auth_user as string | null) ?? null,
    auth_secret: (row.auth_secret as string | null) ?? null,
    session_name: (row.session_name as string | null) ?? null,
  };
}

/** Checks the bridge answers, without messaging a real person. */
export async function testBridge(kind: "whatsapp" | "sms"): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const config = toConfig(await getBridge(kind));
  if (!config) return { ok: false, message: "Save the bridge settings first." };

  const result = await pingBridge(config);

  await supabase
    .from("bridges")
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_ok: result.ok,
      last_test_error: result.ok ? null : result.detail,
    })
    .eq("owner_id", user.id)
    .eq("kind", kind);

  return {
    ok: result.ok,
    message: result.ok ? "Connected." : "Not connected.",
    detail: result.detail,
  };
}

/**
 * Sends one real message to the signed in user's own number.
 *
 * This is the only action here that costs the user something (one SMS from
 * their own plan, or one WhatsApp message). It goes to them, never to a client.
 */
export async function sendTestToSelf(input: {
  kind: "whatsapp" | "sms";
  phone: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in first." };

  const phone = input.phone.trim();
  if (!/^\+?\d{8,15}$/.test(phone.replace(/[\s-]/g, ""))) {
    return {
      ok: false,
      message: "Enter your own number with country code, for example +919876543210.",
    };
  }

  const config = toConfig(await getBridge(input.kind));
  if (!config) {
    return { ok: false, message: "Save the bridge settings first." };
  }

  const text = `This is a test from EscalatePay. If you can read this, reminders will arrive on this number.`;

  const result = await sendViaBridge(config, phone, text);

  await supabase.from("bridge_daily_counts").upsert(
    { owner_id: user.id, kind: input.kind, day: new Date().toISOString().slice(0, 10), sent: 1 },
    { onConflict: "owner_id,kind,day" },
  );

  return {
    ok: result.ok,
    message: result.ok ? "Test message sent." : "Test failed.",
    detail: result.detail,
  };
}
