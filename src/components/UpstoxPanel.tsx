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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiSecretInput, setApiSecretInput] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);
  const [configError, setConfigError] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  async function loadStatus() {
    try {
      const res = await fetch("/api/upstox/status", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      setStatus({ connected: false });
    }
  }

  async function loadConfig() {
    try {
      const res = await fetch("/api/upstox/config");
      const data = await res.json();
      setRedirectUri(data.redirectUri || "");
      if (data.apiKey) setApiKeyInput(data.apiKey);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadStatus();
    loadConfig();

    const params = new URLSearchParams(window.location.search);
    if (params.get("configure_upstox")) {
      setShowConfigModal(true);
    }
  }, []);

  async function handleConnectClick() {
    try {
      const res = await fetch("/api/upstox/config");
      const data = await res.json();
      if (data.hasKeys) {
        window.location.href = "/api/auth/upstox";
      } else {
        setShowConfigModal(true);
      }
    } catch {
      setShowConfigModal(true);
    }
  }

  async function handleSaveAndConnect(e: React.FormEvent) {
    e.preventDefault();
    setConfigError("");

    if (!apiKeyInput.trim() || !apiSecretInput.trim()) {
      setConfigError("Both API Key and API Secret are required.");
      return;
    }

    setSavingKeys(true);
    try {
      const res = await fetch("/api/upstox/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          apiSecret: apiSecretInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save API keys");
      }

      window.location.href = "/api/auth/upstox";
    } catch (err: any) {
      setConfigError(err.message);
      setSavingKeys(false);
    }
  }

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
    <>
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          {status?.connected ? (
            <span className="text-slate-200">
              <strong className="text-accent">Live Upstox Broker Connected</strong>
              {status.userName ? ` (${status.userName})` : ""} — expires{" "}
              {status.expiresAt ? new Date(status.expiresAt).toLocaleTimeString("en-IN") : ""} (daily reset).
            </span>
          ) : (
            <span className="text-slate-200">
              <strong className="text-accent">Free Market Engine Active</strong> — Paper trading unlocked with live quotes (no account required).
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:border-accent disabled:opacity-50 transition-all duration-200"
            title="Download & refresh public NSE symbols list"
          >
            {syncing ? "Syncing..." : "Sync Symbols (Public)"}
          </button>
          <button
            onClick={handleConnectClick}
            className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 font-medium hover:bg-white/20 hover:text-white transition-all duration-200 border border-white/10"
            title="Connect your Upstox broker account for direct broker API feed"
          >
            {status?.connected ? "Reconnect Upstox" : "Connect Upstox Broker (Optional)"}
          </button>
        </div>

        {syncMsg && <p className="w-full text-xs text-muted">{syncMsg}</p>}
      </div>

      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-100">Connect Upstox Broker API</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-muted hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your Upstox Developer App credentials below to log in directly via Upstox OAuth.
            </p>

            <form onSubmit={handleSaveAndConnect} className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Upstox API Key (Client ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5a1b2c3d-..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Upstox API Secret</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. abc123xyz..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
                  value={apiSecretInput}
                  onChange={(e) => setApiSecretInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Redirect URI (set this in Upstox Developer portal)</label>
                <input
                  type="text"
                  readOnly
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-400 outline-none"
                  value={redirectUri || "http://localhost:3000/api/auth/upstox/callback"}
                />
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-[11px] text-muted space-y-1">
                <p className="font-medium text-slate-300">Don't have an Upstox app?</p>
                <p>
                  1. Create a free app at{" "}
                  <a
                    href="https://upstox.com/developer/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    upstox.com/developer/apps
                  </a>
                </p>
                <p>2. Set Redirect URI to: <code className="text-slate-200">{redirectUri || "http://localhost:3000/api/auth/upstox/callback"}</code></p>
              </div>

              {configError && <p className="text-danger text-xs">{configError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:border-white/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKeys}
                  className="flex-1 py-2 rounded-xl bg-accent text-black font-semibold text-xs hover:brightness-95 disabled:opacity-50 shadow-[0_6px_20px_rgba(97,255,201,0.2)]"
                >
                  {savingKeys ? "Connecting..." : "Save & Redirect to Upstox"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
