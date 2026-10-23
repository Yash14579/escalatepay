"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Quick check that the database has been set up. Pages use this to show a
 * clear "run the setup file" panel instead of an empty list that looks like
 * the user has no data.
 */
export async function databaseReady(): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .limit(0);
  return !error;
}
