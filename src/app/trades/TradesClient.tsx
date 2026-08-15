"use client";

import { useCallback, useEffect, useState } from "react";
import TradeForm from "@/components/TradeForm";
import OpenTrades from "@/components/OpenTrades";

interface Trade {
  id: string;
  symbol: string;
  instrumentKey: string | null;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  stopLoss: number | null;
  target: number | null;
}

export default function TradesClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetch("/api/trades?status=OPEN", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data)) {
      setTrades([]);
      setLoading(false);
      if (res.status === 401) {
        setBanner({ type: "error", text: "Please login to access your paper trading workspace." });
      } else {
        setBanner({ type: "error", text: data?.error || "Unable to load trades." });
      }
      return;
    }

    setTrades(data);
    setLoading(false);
  }, []);

  const refreshSilent = useCallback(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">NSE Options Paper Trading Terminal</h1>
        <p className="text-muted">
          Simulate NSE options & stock trades with real-time market quotes and zero financial risk.
        </p>
      </div>

      {banner && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            banner.type === "success" ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="rounded-2xl border border-accent/30 bg-slate-900/80 p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          <div>
            <p className="text-sm font-bold text-white">🟢 Standalone Real-Time NSE Quote Engine Active</p>
            <p className="text-xs text-slate-300">Live prices & option premiums automatically refresh with zero broker API setup.</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent">
          100% Free & Automated
        </span>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-6 items-start">
        <TradeForm onCreated={refreshSilent} />
        <div>
          <h2 className="font-semibold mb-3">Open Positions</h2>
          {loading ? (
            <p className="text-muted text-sm">Loading positions...</p>
          ) : (
            <OpenTrades trades={trades} onChanged={refreshSilent} />
          )}
        </div>
      </div>
    </div>
  );
}
