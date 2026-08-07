"use client";

import { useEffect, useState } from "react";

interface Status {
  connected: boolean;
  userName?: string | null;
  expiresAt?: string;
}

export default function UpstoxPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  async function loadStatus() {
    const res = await fetch("/api/upstox/status", { cache: "no-store" });
    setStatus(await res.json());
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/instruments/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Synced ${data.kept} instruments (from ${data.fetched} total on NSE).`);
      } else {
        setSyncMsg(`Sync failed: ${data.error}`);
      }
    } catch (err: any) {
      setSyncMsg(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${status?.connected ? "bg-accent" : "bg-muted"}`}
        />
        {status?.connected ? (
          <span>
            Live Upstox data connected{status.userName ? ` as ${status.userName}` : ""} — expires{" "}
            {status.expiresAt ? new Date(status.expiresAt).toLocaleTimeString("en-IN") : ""} (daily
            reset).
          </span>
        ) : (
          <span className="text-muted">
            Not connected — using manual price entry. Live data needs a free Upstox account.
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:border-accent disabled:opacity-50 transition-all duration-200"
        >
          {syncing ? "Syncing..." : "Sync Symbol List"}
        </button>
        <a
          href="/api/auth/upstox"
          className="text-xs px-3 py-1.5 rounded-xl bg-accent text-black font-medium hover:brightness-95 transition-all duration-200 shadow-[0_8px_22px_rgba(97,255,201,0.18)]"
        >
          {status?.connected ? "Reconnect Upstox" : "Connect Upstox"}
        </a>
      </div>

      {syncMsg && <p className="w-full text-xs text-muted">{syncMsg}</p>}
    </div>
  );
}
