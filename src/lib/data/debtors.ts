"use server";

import { createClient } from "@/lib/supabase/server";

/** Turns a raw Postgres/PostgREST error into something a person can act on. */
function friendlyDbError(message: string): string {
  if (message.includes("PGRST205") || message.includes("schema cache")) {
    return "The database tables are not set up yet. Run supabase-schema.sql in your Supabase SQL editor, then try again.";
  }
  if (message.includes("row-level security")) {
    return "You are not signed in, or your session expired. Sign in again and retry.";
  }
  return message;
}


export async function getDebtors() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("debtors")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDebtors failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createDebtor(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const name = (formData.get("name") as string).trim();
  const phone = (formData.get("phone") as string).trim();
  const amount = Number(formData.get("amount"));
  const currency = (formData.get("currency") as string) || "USD";
  const reason = (formData.get("reason") as string).trim() || null;
  const due_date = formData.get("due_date") as string || null;

  const { data, error } = await supabase
    .from("debtors")
    .insert({
      owner_id: user.id,
      name,
      phone,
      amount_minor: Math.round(amount * 100),
      currency,
      reason,
      due_date: due_date || null,
    })
    .select()
    .single();

  if (error) throw new Error(friendlyDbError(error.message));
  return data;
}

export async function updateDebtorStatus(id: string, status: "pending" | "reminded" | "partial" | "paid") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "reminded") updates.last_reminded_at = new Date().toISOString();

  const { error } = await supabase
    .from("debtors")
    .update(updates)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

export async function markPartial(id: string, amountPaidMinor: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("debtors")
    .update({
      amount_paid_minor: amountPaidMinor,
      status: "partial",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}

export async function deleteDebtor(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("debtors")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) throw new Error(friendlyDbError(error.message));
}
