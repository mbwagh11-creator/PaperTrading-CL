"use client";

import { useCallback, useEffect, useState } from "react";
import TradeForm from "@/components/TradeForm";
import OpenTrades from "@/components/OpenTrades";
import OptionChain from "@/components/OptionChain";

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
  const [marketStatusText, setMarketStatusText] = useState("Connecting to Live Real NSE Data Feed...");
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{ symbol: string; entryPrice: number; quantity: number } | null>(null);

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

  async function checkMarketHours() {
    try {
      const res = await fetch("/api/market/quote?symbol=NIFTY");
      const data = await res.json();
      if (data.statusText) {
        setMarketStatusText(data.statusText);
        setIsMarketOpen(Boolean(data.isMarketOpen));
      }
    } catch {
      // fallback
    }
  }

  const refreshSilent = useCallback(() => {
    load(true);
  }, [load]);

  useEffect(() => {
    load();
    checkMarketHours();
    const interval = setInterval(checkMarketHours, 10000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">NSE Options Paper Trading Terminal</h1>
        <p className="text-muted">
          Simulate NSE options & stock trades with real-time live market quotes and zero financial risk.
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

      {/* Real NSE Market Status Banner */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isMarketOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
          <div>
            <p className="text-sm font-bold text-white">{marketStatusText}</p>
            <p className="text-xs text-slate-300">
              {isMarketOpen
                ? "Official NSE market is OPEN (9:15 AM - 3:30 PM IST). Live floor prices streaming."
                : "Real NSE market is CLOSED. Live prices are 100% frozen at official market closing levels."}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
            isMarketOpen
              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
              : "bg-slate-800 text-slate-400 border-white/10"
          }`}
        >
          {isMarketOpen ? "⚡ Official NSE Live Feed" : "🔒 Market Closed (Static Quotes)"}
        </span>
      </div>

      {/* Feature 1: Interactive Option Chain Table */}
      <OptionChain onSelectOption={(opt) => setSelectedOption(opt)} />

      <div className="grid md:grid-cols-[380px_1fr] gap-6 items-start">
        <TradeForm onCreated={refreshSilent} selectedOption={selectedOption} />
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
