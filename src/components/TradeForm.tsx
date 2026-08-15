"use client";

import { useEffect, useState } from "react";

interface InstrumentResult {
  instrumentKey: string;
  tradingSymbol: string;
  instrumentType: string | null;
  strikePrice: number | null;
  expiry: string | null;
  lotSize: number | null;
}

export default function TradeForm({ onCreated }: { onCreated: () => void }) {
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

  useEffect(() => {
    async function checkMarket() {
      try {
        const res = await fetch("/api/market/quote?symbol=NIFTY");
        const data = await res.json();
        setIsMarketOpen(Boolean(data.isMarketOpen));
      } catch {
        // fallback
      }
    }
    checkMarket();
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

    if (!isMarketOpen) {
      setError("Order Rejected: NSE Market is currently CLOSED. Trading is strictly permitted only during live exchange hours (Mon-Fri 9:15 AM - 3:30 PM IST).");
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

  const inputClass =
    "w-full bg-slate-900/70 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-accent/70 focus:ring-2 focus:ring-accent/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 space-y-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New Paper Trade</h2>
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            isMarketOpen
              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
          }`}
        >
          {isMarketOpen ? "🟢 Market Open" : "🔒 Market Closed"}
        </span>
      </div>

      <div className="relative">
        <label className="text-xs text-muted block mb-1">
          Symbol {instrumentKey && <span className="text-accent">● matched symbol</span>}
        </label>
        <input
          className={inputClass}
          placeholder="e.g. NIFTY, RELIANCE, TCS..."
          value={symbol}
          onChange={(e) => handleSymbolChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl text-sm shadow-2xl">
            {suggestions.map((inst) => (
              <li
                key={inst.instrumentKey}
                onMouseDown={() => pickSuggestion(inst)}
                className="px-3 py-2 hover:bg-white/10 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0"
              >
                <span className="font-medium text-slate-200">{inst.tradingSymbol}</span>
                <span className="text-muted text-xs">
                  {inst.instrumentType}
                  {inst.strikePrice ? ` ${inst.strikePrice}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
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
          <label className="text-xs text-muted block mb-1">Quantity</label>
          <input
            type="number"
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
              disabled={fetchingPrice || !symbol}
              onClick={() => fetchCurrentPrice()}
              className="text-[10px] text-accent hover:underline disabled:opacity-50"
            >
              {fetchingPrice ? "Fetching..." : "⚡ Get Market Price"}
            </button>
          </div>
          <input
            type="number"
            step="0.05"
            className={inputClass}
            placeholder="e.g. 150.50"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
          {priceMsg && <p className="text-[11px] text-accent mt-1">{priceMsg}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Stop Loss (optional)</label>
          <input
            type="number"
            step="0.05"
            className={inputClass}
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Target (optional)</label>
          <input
            type="number"
            step="0.05"
            className={inputClass}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-rose-400 text-xs bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !isMarketOpen}
        className={`w-full font-medium py-2.5 rounded-xl transition-all duration-200 ${
          isMarketOpen
            ? "bg-accent text-black hover:brightness-95 shadow-[0_10px_24px_rgba(97,255,201,0.18)] cursor-pointer"
            : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10"
        }`}
      >
        {submitting ? "Placing..." : isMarketOpen ? "Place Trade" : "🔒 Market Closed (Trading Disabled)"}
      </button>
    </form>
  );
}
