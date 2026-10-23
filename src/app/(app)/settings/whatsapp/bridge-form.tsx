"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, PlugZap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveBridge, setBridgeEnabled, deleteBridge } from "@/lib/data/bridges";
import { testBridge, sendTestToSelf, type ActionResult } from "@/lib/data/bridge-actions";
import { BRIDGE_PRESETS } from "@/lib/bridges/presets";

export function BridgeForm({
  kind,
  existing,
}: {
  kind: "whatsapp" | "sms";
  existing: {
    provider: "waha" | "sms_gateway";
    endpoint: string;
    auth_user: string | null;
    auth_secret: string | null;
    session_name: string | null;
    enabled: boolean;
    last_test_ok: boolean | null;
    last_test_error: string | null;
  } | null;
}) {
  const router = useRouter();
  const preset = kind === "sms" ? BRIDGE_PRESETS.sms_gateway : BRIDGE_PRESETS.waha;

  const [provider, setProvider] = useState<"waha" | "sms_gateway">(
    existing?.provider ?? preset.kind === "sms" ? "sms_gateway" : "waha",
  );
  const [endpoint, setEndpoint] = useState(
    existing?.endpoint ?? (kind === "sms" ? String(preset.endpoint) : ""),
  );
  const [authUser, setAuthUser] = useState(existing?.auth_user ?? "");
  const [authSecret, setAuthSecret] = useState(existing?.auth_secret ?? "");
  const [session, setSession] = useState(existing?.session_name ?? "default");
  const [testPhone, setTestPhone] = useState("");

  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        await saveBridge({
          kind,
          provider,
          endpoint,
          authUser,
          authSecret,
          sessionName: session,
        });
        router.refresh();
        setResult({ ok: true, message: "Saved." });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  };

  const runTest = () => {
    setError(null);
    startTransition(async () => {
      const r = await testBridge(kind);
      setResult(r);
      router.refresh();
    });
  };

  const runSendTest = () => {
    setError(null);
    startTransition(async () => {
      const r = await sendTestToSelf({ kind, phone: testPhone });
      setResult(r);
    });
  };

  const toggle = () => {
    startTransition(async () => {
      try {
        await setBridgeEnabled(kind, !existing?.enabled);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update");
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      try {
        await deleteBridge(kind);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove");
      }
    });
  };

  return (
    <div className="space-y-3">
      {existing && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={existing.enabled ? "success" : "outline"}>
            {existing.enabled ? "Auto-send on" : "Auto-send off"}
          </Badge>
          {existing.last_test_ok === true && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          )}
          {existing.last_test_ok === false && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3" /> Not connected
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {kind === "sms" && (
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs text-muted-foreground">Provider</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "waha" | "sms_gateway")}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="sms_gateway">SMS Gateway for Android (sms-gate.app)</option>
            </select>
          </label>
        )}

        <label className="space-y-1 sm:col-span-2">
          <span className="block text-xs text-muted-foreground">
            {kind === "sms" ? "Gateway address" : "Your WAHA address"}
          </span>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={
              kind === "sms"
                ? "https://api.sms-gate.app/3rdparty/v1/messages"
                : "https://your-tunnel.trycloudflare.com"
            }
            className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
          />
        </label>

        {kind === "sms" ? (
          <>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground">
                Username from the phone app
              </span>
              <input
                value={authUser}
                onChange={(e) => setAuthUser(e.target.value)}
                autoComplete="off"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground">
                Password from the phone app
              </span>
              <input
                type="password"
                value={authSecret}
                onChange={(e) => setAuthSecret(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </>
        ) : (
          <>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground">API key</span>
              <input
                type="password"
                value={authSecret}
                onChange={(e) => setAuthSecret(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground">Session name</span>
              <input
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={runTest} disabled={pending || !existing}>
          <PlugZap className="size-4" />
          Test connection
        </Button>
        {existing && (
          <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
            {existing.enabled ? "Turn auto-send off" : "Turn auto-send on"}
          </Button>
        )}
        {existing && (
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {existing && (
        <div className="space-y-2 rounded-md border bg-secondary/30 p-3">
          <p className="text-xs font-medium">Send a real test to your own phone</p>
          <p className="text-[11px] text-muted-foreground">
            This sends one message and uses one message from your own plan. It
            only ever goes to the number you type here.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+919876543210"
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={runSendTest}
              disabled={pending || !testPhone}
            >
              Send test
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div
          className={
            "rounded-md border px-3 py-2 text-xs " +
            (result.ok
              ? "border-success/40 bg-[color-mix(in_oklch,var(--success)_8%,transparent)]"
              : "border-destructive/40 bg-[color-mix(in_oklch,var(--destructive)_8%,transparent)]")
          }
        >
          <p className="font-medium">{result.message}</p>
          {result.detail && (
            <p className="mt-0.5 text-muted-foreground">{result.detail}</p>
          )}
        </div>
      )}

      {existing?.last_test_error && !result && (
        <p className="text-xs text-muted-foreground">
          Last test: {existing.last_test_error}
        </p>
      )}
    </div>
  );
}
