"use client";

import { useCallback, useEffect, useState } from "react";
import TradeForm from "@/components/TradeForm";
import OpenTrades from "@/components/OpenTrades";
import UpstoxPanel from "@/components/UpstoxPanel";

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

    const params = new URLSearchParams(window.location.search);
    if (params.get("upstox_connected")) {
      setBanner({ type: "success", text: "Upstox broker connected — live prices synchronized." });
    } else if (params.get("upstox_error")) {
      setBanner({ type: "error", text: `Upstox connection info: ${params.get("upstox_error")}` });
    }
    if (params.has("upstox_connected") || params.has("upstox_error")) {
      window.history.replaceState({}, "", "/trades");
    }
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

      <UpstoxPanel />

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
