"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface InstrumentResult {
  instrumentKey: string;
  tradingSymbol: string;
  instrumentType: string | null;
  strikePrice: number | null;
  expiry: string | null;
  lotSize: number | null;
}

interface TradeFormProps {
  onCreated: () => void;
  selectedOption?: { symbol: string; entryPrice: number; quantity: number } | null;
}

export default function TradeForm({ onCreated, selectedOption }: TradeFormProps) {
  const [symbol, setSymbol] = useState("");
  const [instrumentKey, setInstrumentKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<InstrumentResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceMsg, setPriceMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<string>("TRIAL");

  // Auto-fill from Option Chain selection
  useEffect(() => {
    if (selectedOption) {
      setSymbol(selectedOption.symbol);
      setEntryPrice(String(selectedOption.entryPrice));
      setQuantity(String(selectedOption.quantity));
      setSide("BUY");
      setPriceMsg(`Selected ${selectedOption.symbol} @ ₹${selectedOption.entryPrice}`);

      const price = selectedOption.entryPrice;
      const slVal = Number((price * 0.85).toFixed(2));
      const targetVal = Number((price * 1.3).toFixed(2));
      setStopLoss(String(slVal));
      setTarget(String(targetVal));
    }
  }, [selectedOption]);

  useEffect(() => {
    async function checkStatus() {
      try {
        const [quoteRes, subRes] = await Promise.all([
          fetch("/api/market/quote?symbol=NIFTY"),
          fetch("/api/subscription/status"),
        ]);

        const quoteData = await quoteRes.json();
        const subData = await subRes.json();

        setIsMarketOpen(Boolean(quoteData.isMarketOpen));
        if (subData.subscription?.status) {
          setSubStatus(subData.subscription.status);
        }
      } catch {
        // fallback
      }
    }
    checkStatus();
  }, []);

  async function handleSymbolChange(value: string) {
    setSymbol(value);
    setInstrumentKey(null);
    setPriceMsg("");

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch {
      // silently ignore
    }
  }

  async function fetchCurrentPrice(targetSymbol?: string, targetKey?: string | null) {
    const sym = (targetSymbol || symbol).trim();
    if (!sym) {
      setError("Please enter a symbol first.");
      return;
    }

    setFetchingPrice(true);
    setError("");
    setPriceMsg("");
    try {
      const params = new URLSearchParams();
      const keyToUse = targetKey !== undefined ? targetKey : instrumentKey;
      if (keyToUse) params.set("instrumentKey", keyToUse);
      params.set("symbol", sym);

      const res = await fetch(`/api/market/quote?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || data.lastPrice === undefined) {
        throw new Error(data.error || "Could not fetch price");
      }

      setEntryPrice(String(data.lastPrice));
      setIsMarketOpen(Boolean(data.isMarketOpen));
      setPriceMsg(`Loaded ₹${data.lastPrice} (${data.isMarketOpen ? "Live NSE Feed" : "Static Close Price"})`);
    } catch (err: any) {
      setError(`Price fetch failed: ${err.message}`);
    } finally {
      setFetchingPrice(false);
    }
  }

  function pickSuggestion(inst: InstrumentResult) {
    setSymbol(inst.tradingSymbol);
    setInstrumentKey(inst.instrumentKey);
    if (inst.lotSize) setQuantity(String(inst.lotSize));
    setSuggestions([]);
    setShowSuggestions(false);
    fetchCurrentPrice(inst.tradingSymbol, inst.instrumentKey);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (subStatus === "EXPIRED") {
      setError("Trial Expired: Please subscribe at ₹149/month on the Pricing page to place new trades.");
      return;
    }

    if (!isMarketOpen) {
      setError(
        "Order Rejected: NSE Market is currently CLOSED. Trading is strictly permitted only during live exchange hours (Mon-Fri 9:15 AM - 3:30 PM IST)."
      );
      return;
    }

    if (!symbol || !quantity || !entryPrice) {
      setError("Symbol, quantity and entry price are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          instrumentKey,
          side,
          quantity,
          entryPrice,
          stopLoss: stopLoss || undefined,
          target: target || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create trade");
      }

      setSymbol("");
      setInstrumentKey(null);
      setQuantity("");
      setEntryPrice("");
      setStopLoss("");
      setTarget("");
      setPriceMsg("");
      setSide("BUY");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Real-Time Risk / Reward & Position Sizing Calculation
  const qNum = parseFloat(quantity) || 0;
  const eNum = parseFloat(entryPrice) || 0;
  const slNum = parseFloat(stopLoss) || 0;
  const tgNum = parseFloat(target) || 0;

  const hasRiskCalc = qNum > 0 && eNum > 0 && slNum > 0 && tgNum > 0;
  const riskPerUnit = Math.abs(eNum - slNum);
  const rewardPerUnit = Math.abs(tgNum - eNum);
  const maxLoss = Number((riskPerUnit * qNum).toFixed(2));
  const maxProfit = Number((rewardPerUnit * qNum).toFixed(2));
  const rrRatio = riskPerUnit > 0 ? (rewardPerUnit / riskPerUnit).toFixed(2) : "0";

  const isExpired = subStatus === "EXPIRED";

  const inputClass =
    "w-full bg-slate-900/70 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-accent/70 focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New Paper Trade Order</h2>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            isExpired
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
              : isMarketOpen
              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
              : "bg-amber-400/20 text-amber-300 border-amber-400/30"
          }`}
        >
          {isExpired ? "🔴 Trial Expired" : isMarketOpen ? "🟢 Market Open" : "🔒 Market Closed"}
        </span>
      </div>

      {isExpired && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200 space-y-2">
          <p className="font-bold">🔴 Your 7-day free trial has expired.</p>
          <p className="text-[11px] text-slate-300">
            Your Trade Journal & Analytics remain <strong>100% accessible</strong>. Upgrade to PRO to place new trades.
          </p>
          <Link
            href="/pricing"
            className="inline-block w-full text-center bg-rose-500 text-white font-bold py-1.5 rounded-lg hover:bg-rose-400 transition-colors text-xs"
          >
            Upgrade to PRO (₹149/mo) →
          </Link>
        </div>
      )}

      <div className="relative">
        <label className="text-xs text-muted block mb-1">
          Symbol {instrumentKey && <span className="text-accent">● matched symbol</span>}
        </label>
        <input
          disabled={isExpired}
          className={inputClass}
          placeholder="e.g. NIFTY 24500 CE, BANKNIFTY 57500 PE, 55000..."
          value={symbol}
          onChange={(e) => handleSymbolChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-slate-900 border border-white/20 rounded-xl text-sm shadow-2xl divide-y divide-white/5">
            {suggestions.map((inst) => {
              const isCE = inst.tradingSymbol.endsWith("CE") || inst.instrumentType === "CE";
              const isPE = inst.tradingSymbol.endsWith("PE") || inst.instrumentType === "PE";

              return (
                <li
                  key={inst.instrumentKey}
                  onMouseDown={() => pickSuggestion(inst)}
                  className="px-3.5 py-2.5 hover:bg-white/10 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <span className="font-semibold text-slate-100">{inst.tradingSymbol}</span>
                  <div className="flex items-center gap-2 text-xs">
                    {inst.lotSize && (
                      <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        Lot: {inst.lotSize}
                      </span>
                    )}
                    {isCE && (
                      <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded font-bold">
                        CALL (CE)
                      </span>
                    )}
                    {isPE && (
                      <span className="text-[10px] bg-rose-400/20 text-rose-300 border border-rose-400/30 px-1.5 py-0.5 rounded font-bold">
                        PUT (PE)
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isExpired}
          onClick={() => setSide("BUY")}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
            side === "BUY"
              ? "bg-accent text-black border-accent shadow-[0_8px_22px_rgba(97,255,201,0.25)]"
              : "border-white/10 text-muted hover:border-accent/50"
          }`}
        >
          BUY
        </button>
        <button
          type="button"
          disabled={isExpired}
          onClick={() => setSide("SELL")}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
            side === "SELL"
              ? "bg-danger text-white border-danger shadow-[0_8px_22px_rgba(255,72,72,0.25)]"
              : "border-white/10 text-muted hover:border-danger/40"
          }`}
        >
          SELL
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Quantity (Lots)</label>
          <input
            type="number"
            disabled={isExpired}
            className={inputClass}
            placeholder="e.g. 50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted">Entry Price</label>
            <button
              type="button"
              disabled={isExpired || fetchingPrice || !symbol}
              onClick={() => fetchCurrentPrice()}
              className="text-[10px] text-accent hover:underline disabled:opacity-50"
            >
              {fetchingPrice ? "Fetching..." : "⚡ Get Market Price"}
            </button>
          </div>
          <input
            type="number"
            step="0.05"
            disabled={isExpired}
            className={inputClass}
            placeholder="e.g. 150.50"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
          {priceMsg && <p className="text-[11px] text-accent mt-1 font-medium">{priceMsg}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Stop Loss (₹)</label>
          <input
            type="number"
            step="0.05"
            disabled={isExpired}
            className={inputClass}
            placeholder="e.g. 125.00"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Target (₹)</label>
          <input
            type="number"
            step="0.05"
            disabled={isExpired}
            className={inputClass}
            placeholder="e.g. 200.00"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {/* Real-Time Risk / Reward & Position Sizing Calculator */}
      {hasRiskCalc && (
        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3 text-xs space-y-1.5 shadow-inner">
          <div className="flex justify-between items-center text-slate-300 font-semibold border-b border-white/10 pb-1.5">
            <span>⚖️ Risk / Reward Analysis</span>
            <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/30">
              Ratio 1 : {rrRatio}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">Max Risk (Loss):</span>
              <p className="font-extrabold text-rose-400 text-sm">₹{maxLoss.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-slate-400">Max Profit Target:</span>
              <p className="font-extrabold text-emerald-400 text-sm">₹{maxProfit.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-rose-400 text-xs bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">{error}</p>}

      <button
        type="submit"
        disabled={submitting || isExpired || !isMarketOpen}
        className={`w-full font-medium py-2.5 rounded-xl transition-all duration-200 ${
          isExpired
            ? "bg-rose-950/50 text-rose-400 cursor-not-allowed border border-rose-500/30 font-bold"
            : isMarketOpen
            ? "bg-accent text-black hover:brightness-95 shadow-[0_10px_24px_rgba(97,255,201,0.18)] cursor-pointer font-bold"
            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10"
        }`}
      >
        {submitting
          ? "Placing Order..."
          : isExpired
          ? "🔴 Trial Expired (New Trades Disabled)"
          : isMarketOpen
          ? "Place Trade Order"
          : "🔒 Market Closed (Trading Disabled)"}
      </button>
    </form>
  );
}
