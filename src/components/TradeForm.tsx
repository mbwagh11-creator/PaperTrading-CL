"use client";

import { useState } from "react";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSymbolChange(value: string) {
    setSymbol(value);
    setInstrumentKey(null); // typing freely invalidates a previous pick

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
      // silently ignore - user can still type a symbol manually
    }
  }

  function pickSuggestion(inst: InstrumentResult) {
    setSymbol(inst.tradingSymbol);
    setInstrumentKey(inst.instrumentKey);
    if (inst.lotSize) setQuantity(String(inst.lotSize));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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
      <h2 className="font-semibold">New Paper Trade</h2>

      <div className="relative">
        <label className="text-xs text-muted block mb-1">
          Symbol {instrumentKey && <span className="text-accent">● matched to live instrument</span>}
        </label>
        <input
          className={inputClass}
          placeholder="e.g. NIFTY, RELIANCE..."
          value={symbol}
          onChange={(e) => handleSymbolChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-panel2 border border-border rounded-lg text-sm">
            {suggestions.map((inst) => (
              <li
                key={inst.instrumentKey}
                onMouseDown={() => pickSuggestion(inst)}
                className="px-3 py-2 hover:bg-border cursor-pointer flex justify-between"
              >
                <span>{inst.tradingSymbol}</span>
                <span className="text-muted text-xs">
                  {inst.instrumentType}
                  {inst.strikePrice ? ` ${inst.strikePrice}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!instrumentKey && symbol.length >= 2 && suggestions.length === 0 && (
          <p className="text-xs text-muted mt-1">
            No live match — you can still submit this as a free-text symbol.
          </p>
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Entry Price</label>
          <input
            type="number"
            step="0.05"
            className={inputClass}
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
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

      {error && <p className="text-danger text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent text-black font-medium py-2.5 rounded-xl hover:brightness-95 transition-all duration-200 disabled:opacity-50 shadow-[0_10px_24px_rgba(97,255,201,0.18)]"
      >
        {submitting ? "Placing..." : "Place Trade"}
      </button>
    </form>
  );
}
