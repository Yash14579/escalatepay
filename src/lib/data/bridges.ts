"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BridgeConfig } from "@/lib/bridges/send";

function friendly(message: string): string {
  if (message.includes("PGRST205") || message.includes("schema cache")) {
    return "The bridge tables are not set up yet. Run supabase-bridge.sql in Supabase, then try again.";
  }
  if (message.includes("duplicate key")) {
    return "You already have a bridge for this channel. Update it instead.";
  }
  return message;
}

export async function saveBridge(input: {
  kind: "whatsapp" | "sms";
  provider: "waha" | "sms_gateway";
  endpoint: string;
  authUser?: string;
  authSecret?: string;
  sessionName?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const endpoint = input.endpoint.trim();
  if (!endpoint) throw new Error("The bridge address is required");
  if (!/^https?:\/\//i.test(endpoint)) {
    throw new Error("The address must start with https://");
  }

  const { error } = await supabase.from("bridges").upsert(
    {
      owner_id: user.id,
      kind: input.kind,
      provider: input.provider,
      endpoint,
      auth_user: input.authUser?.trim() || null,
      auth_secret: input.authSecret?.trim() || null,
      session_name: input.sessionName?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,kind" },
  );

  if (error) throw new Error(friendly(error.message));
  revalidatePath("/settings/whatsapp");
}

export async function getBridge(kind: "whatsapp" | "sms") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("bridges")
    .select("*")
    .eq("owner_id", user.id)
    .eq("kind", kind)
    .maybeSingle();

  return data;
}

export async function setBridgeEnabled(kind: "whatsapp" | "sms", enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("bridges")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("owner_id", user.id)
    .eq("kind", kind);

  if (error) throw new Error(friendly(error.message));
  revalidatePath("/settings/whatsapp");
}

export async function deleteBridge(kind: "whatsapp" | "sms") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("bridges")
    .delete()
    .eq("owner_id", user.id)
    .eq("kind", kind);

  if (error) throw new Error(friendly(error.message));
  revalidatePath("/settings/whatsapp");
}

/** The bridge row, in the shape the sender expects, or null if unusable. */
export async function enabledBridgeFor(kind: "whatsapp" | "sms"): Promise<BridgeConfig | null> {
  const row = await getBridge(kind);
  if (!row || !row.enabled) return null;
  return {
    kind: row.kind,
    provider: row.provider,
    endpoint: row.endpoint,
    auth_user: row.auth_user,
    auth_secret: row.auth_secret,
    session_name: row.session_name,
  };
}
