"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FloatingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol: string;
  initialEntryPrice: number;
  initialQuantity: number;
  onOrderCreated: () => void;
  isMarketOpen: boolean;
  subStatus: string;
}

export default function FloatingOrderModal({
  isOpen,
  onClose,
  initialSymbol,
  initialEntryPrice,
  initialQuantity,
  onOrderCreated,
  isMarketOpen,
  subStatus,
}: FloatingOrderModalProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [entryPrice, setEntryPrice] = useState(String(initialEntryPrice));
  const [stopLoss, setStopLoss] = useState("");
  const [target, setTarget] = useState("");
  
  // Lot calculations
  const unitLot = initialQuantity > 0 ? initialQuantity : symbol.includes("BANK") ? 30 : 50;
  const [lots, setLots] = useState(1);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSymbol(initialSymbol);
      setEntryPrice(String(initialEntryPrice));
      const lotBase = initialQuantity > 0 ? initialQuantity : initialSymbol.includes("BANK") ? 30 : 50;
      setLots(1);
      setSide("BUY");
      setOrderType("MARKET");
      setError("");
      setSuccessMsg("");

      // Default SL & Target calculation
      const p = initialEntryPrice;
      if (p > 0) {
        setStopLoss((p * 0.85).toFixed(2));
        setTarget((p * 1.3).toFixed(2));
      }
    }
  }, [isOpen, initialSymbol, initialEntryPrice, initialQuantity]);

  if (!isOpen) return null;

  const totalQuantity = lots * unitLot;
  const priceNum = parseFloat(entryPrice) || 0;
  const requiredMargin = Number((priceNum * totalQuantity).toFixed(2));

  const slNum = parseFloat(stopLoss) || 0;
  const tgNum = parseFloat(target) || 0;
  const hasRiskCalc = priceNum > 0 && slNum > 0 && tgNum > 0 && totalQuantity > 0;
  const riskPerUnit = Math.abs(priceNum - slNum);
  const rewardPerUnit = Math.abs(tgNum - priceNum);
  const maxLoss = Number((riskPerUnit * totalQuantity).toFixed(2));
  const maxProfit = Number((rewardPerUnit * totalQuantity).toFixed(2));
  const rrRatio = riskPerUnit > 0 ? (rewardPerUnit / riskPerUnit).toFixed(2) : "0";

  const isExpired = subStatus === "EXPIRED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (isExpired) {
      setError("Trial Expired: Please subscribe on the Pricing page to place new trades.");
      return;
    }

    if (!isMarketOpen) {
      setError("Order Rejected: NSE Market is currently CLOSED (Trading permitted Mon-Fri 9:15 AM - 3:30 PM IST).");
      return;
    }

    if (!symbol || totalQuantity <= 0 || priceNum <= 0) {
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
          side,
          quantity: totalQuantity,
          entryPrice: priceNum,
          stopLoss: stopLoss || undefined,
          target: target || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setSuccessMsg(`🎉 Order Executed! ${side} ${totalQuantity} Qty @ ₹${priceNum}`);
      setTimeout(() => {
        onOrderCreated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center max-md:items-end p-4 max-md:p-0 bg-[#090A0F]/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Box (Bottom Sheet on Mobile) */}
      <div className="w-full max-w-md bg-[#12151E] border border-white/15 rounded-3xl max-md:rounded-b-none max-md:rounded-t-3xl shadow-[0_25px_90px_rgba(0,0,0,0.75)] overflow-hidden space-y-4 max-md:animate-slideUp">
        
        {/* Header Ribbon */}
        <div className={`p-4 border-b border-white/10 flex items-center justify-between ${
          side === "BUY" ? "bg-[#00E599]/10" : "bg-[#FF3B5C]/10"
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                side === "BUY"
                  ? "bg-[#00E599] text-[#090A0F] border-[#00E599]"
                  : "bg-[#FF3B5C] text-white border-[#FF3B5C]"
              }`}>
                {side}
              </span>
              <h3 className="font-extrabold text-white text-base tracking-tight">{symbol}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              LTP <strong className="text-white">₹{initialEntryPrice}</strong> • Lot Size: {unitLot} Qty
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 pt-1">
          {/* Side Toggle: BUY vs SELL */}
          <div className="grid grid-cols-2 gap-2 bg-[#080C11] p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                side === "BUY"
                  ? "bg-[#00E599] text-[#090A0F] shadow-[0_4px_14px_rgba(0,229,153,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              BUY (CALL / LONG)
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                side === "SELL"
                  ? "bg-[#FF3B5C] text-white shadow-[0_4px_14px_rgba(255,59,92,0.35)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              SELL (SHORT)
            </button>
          </div>

          {/* Order Type: Market vs Limit */}
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
            <span>Order Type:</span>
            <div className="flex bg-[#080C11] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setOrderType("MARKET");
                  setEntryPrice(String(initialEntryPrice));
                }}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  orderType === "MARKET" ? "bg-[#00E599] text-[#090A0F] shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Market (LTP)
              </button>
              <button
                type="button"
                onClick={() => setOrderType("LIMIT")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  orderType === "LIMIT" ? "bg-[#00E599] text-[#090A0F] shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Limit Price
              </button>
            </div>
          </div>

          {/* Lot Stepper Controls */}
          <div className="bg-[#080C11] border border-white/10 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Lots (Qty)</span>
              <span className="text-emerald-400 font-bold font-mono">
                {lots} {lots === 1 ? "Lot" : "Lots"} = {totalQuantity} Qty
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLots(Math.max(1, lots - 1))}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-lg flex items-center justify-center border border-white/10 transition-all active:scale-95"
              >
                -
              </button>
              <div className="flex-1 text-center bg-slate-900 border border-white/10 rounded-xl py-2 font-extrabold text-base text-white font-mono">
                {lots}
              </div>
              <button
                type="button"
                onClick={() => setLots(lots + 1)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-lg flex items-center justify-center border border-white/10 transition-all active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Entry Price & Risk Target Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.05"
                disabled={orderType === "MARKET"}
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Stop Loss (₹)</label>
              <input
                type="number"
                step="0.05"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-rose-300 font-mono outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Target (₹)</label>
              <input
                type="number"
                step="0.05"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-emerald-300 font-mono outline-none"
              />
            </div>
          </div>

          {/* Required Margin & Risk Summary Box */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300 font-semibold border-b border-white/10 pb-1.5">
              <span>Required Premium Margin:</span>
              <span className="text-emerald-400 font-extrabold text-sm font-mono">
                ₹{requiredMargin.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-white/5 pb-1">
              <span>Order Brokerage Charges:</span>
              <span className="text-rose-400 font-bold font-mono">₹50.00 / order leg</span>
            </div>

            {hasRiskCalc && (
              <div className="grid grid-cols-3 gap-1 text-[11px] pt-0.5">
                <div>
                  <span className="text-slate-400 text-[10px]">Max Risk:</span>
                  <p className="font-extrabold text-rose-400 font-mono">₹{maxLoss.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Max Profit:</span>
                  <p className="font-extrabold text-emerald-400 font-mono">₹{maxProfit.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">R:R Ratio:</span>
                  <p className="font-extrabold text-amber-300 font-mono">1 : {rrRatio}</p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-rose-400 text-xs bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30 font-medium">{error}</p>}
          {successMsg && <p className="text-emerald-400 text-xs bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 font-medium">{successMsg}</p>}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting || isExpired || !isMarketOpen}
            className={`w-full py-3 rounded-2xl font-extrabold text-sm transition-all shadow-xl ${
              isExpired
                ? "bg-rose-950/50 text-rose-400 cursor-not-allowed border border-rose-500/30"
                : !isMarketOpen
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/10"
                : side === "BUY"
                ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_8px_25px_rgba(52,211,153,0.3)] hover:scale-[1.01]"
                : "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_8px_25px_rgba(244,63,94,0.3)] hover:scale-[1.01]"
            }`}
          >
            {submitting
              ? "Executing Order..."
              : isExpired
              ? "🔴 Trial Expired"
              : !isMarketOpen
              ? "🔒 Market Closed (Trading Disabled)"
              : `⚡ Instant ${side} Order`}
          </button>
        </form>
      </div>
    </div>
  );
}
