"use server";

import { createClient } from "@/lib/supabase/server";

export async function getInvoices() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getInvoice(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  return data ?? null;
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const number = (formData.get("number") as string).trim();
  const amount = Number(formData.get("amount"));
  const currency = (formData.get("currency") as string) || "USD";
  const recipient_name = (formData.get("recipient_name") as string).trim();
  const recipient_email = (formData.get("recipient_email") as string).trim() || null;
  const recipient_phone = (formData.get("recipient_phone") as string).trim() || null;
  const due_at = formData.get("due_at") as string;
  const recipient_timezone = (formData.get("recipient_timezone") as string) || "America/New_York";

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: user.id,
      number,
      amount_minor: Math.round(amount * 100),
      currency,
      due_at: new Date(due_at).toISOString(),
      status: "draft",
      recipient_name,
      recipient_email,
      recipient_phone,
      recipient_timezone,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function setInvoiceStatus(id: string, status: "armed" | "paused" | "paid" | "cancelled") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const updates: Record<string, unknown> = { status };
  if (status === "armed") updates.armed_at = new Date().toISOString();
  if (status === "paid") updates.paid_at = new Date().toISOString();

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);
}
