"use client";

import { useCallback, useEffect, useState } from "react";
import TradeForm from "@/components/TradeForm";
import OpenTrades from "@/components/OpenTrades";
import OptionChain from "@/components/OptionChain";
import FloatingOrderModal from "@/components/FloatingOrderModal";

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
  const [subStatus, setSubStatus] = useState<string>("TRIAL");
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(7);
  const [selectedOption, setSelectedOption] = useState<{ symbol: string; entryPrice: number; quantity: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const [quoteRes, subRes] = await Promise.all([
        fetch("/api/market/quote?symbol=NIFTY"),
        fetch("/api/subscription/status").catch(() => null),
      ]);
      const data = await quoteRes.json();
      if (data.statusText) {
        setMarketStatusText(data.statusText);
        setIsMarketOpen(Boolean(data.isMarketOpen));
      }
      if (subRes && subRes.ok) {
        const subData = await subRes.json();
        if (subData.subscription?.status) {
          setSubStatus(subData.subscription.status);
          setTrialDaysRemaining(subData.subscription.trialDaysRemaining ?? 7);
        }
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

  function handleOptionSelect(opt: { symbol: string; entryPrice: number; quantity: number }) {
    setSelectedOption(opt);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Floating Order Ticket Modal */}
      {selectedOption && (
        <FloatingOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialSymbol={selectedOption.symbol}
          initialEntryPrice={selectedOption.entryPrice}
          initialQuantity={selectedOption.quantity}
          onOrderCreated={refreshSilent}
          isMarketOpen={isMarketOpen}
          subStatus={subStatus}
        />
      )}

      {/* Trial Countdown Header Announcement Bar */}
      {subStatus === "TRIAL" && (
        <div className="bg-[#00E599]/10 border border-[#00E599]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-[#00E599]">⚡</span>
            <span>
              Free PRO Trial Active: <strong className="text-[#00E599] font-bold">{trialDaysRemaining} Days Remaining</strong>
            </span>
          </div>
          <a
            href="/pricing"
            className="px-3.5 py-1 rounded-xl bg-[#00E599] text-[#090A0F] font-extrabold hover:brightness-110 transition-all shadow-sm shrink-0"
          >
            Upgrade to Unlimited PRO →
          </a>
        </div>
      )}

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

      {/* Interactive Option Chain Table with Greeks & Floating Modal Trigger */}
      <OptionChain onSelectOption={handleOptionSelect} />

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
