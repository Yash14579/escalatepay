"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"magic" | "password">("magic");
  
  let supabase;
  try {
    supabase = createClient();
  } catch (e) {
    supabase = null;
  }

  const signInMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">Sign in to EscalatePay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent && mode === "magic" ? (
            <p className="text-sm text-muted-foreground">
              Check your email for a magic link to sign in. Copy the link and paste it in your browser if your email app pre-fetched it.
            </p>
          ) : (
            <>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setMode("magic")}
                  className={`flex-1 rounded-md border px-2 py-1 ${mode === "magic" ? "bg-secondary" : ""}`}
                >
                  Magic link
                </button>
                <button
                  onClick={() => setMode("password")}
                  className={`flex-1 rounded-md border px-2 py-1 ${mode === "password" ? "bg-secondary" : ""}`}
                >
                  Password
                </button>
              </div>

              {mode === "magic" ? (
                <form onSubmit={signInMagic} className="space-y-3">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading || !supabase}>
                    {loading ? "Sending..." : "Send magic link"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={signInPassword} className="space-y-3">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading || !supabase}>
                    {loading ? "Signing in..." : "Sign in with password"}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
