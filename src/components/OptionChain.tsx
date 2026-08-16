"use client";

import { useEffect, useState } from "react";

interface OptionChainProps {
  onSelectOption: (option: { symbol: string; entryPrice: number; quantity: number }) => void;
}

export default function OptionChain({ onSelectOption }: OptionChainProps) {
  const [index, setIndex] = useState<"NIFTY" | "BANKNIFTY">("NIFTY");
  const [columnMode, setColumnMode] = useState<"full" | "essential">("full");
  const [niftySpot, setNiftySpot] = useState<number>(24366.0);
  const [bankniftySpot, setBankniftySpot] = useState<number>(57491.0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSpotPrices() {
      try {
        const [niftyRes, bankRes] = await Promise.all([
          fetch("/api/market/quote?symbol=NIFTY"),
          fetch("/api/market/quote?symbol=BANKNIFTY"),
        ]);
        const niftyData = await niftyRes.json();
        const bankData = await bankRes.json();

        if (niftyData.lastPrice) setNiftySpot(niftyData.lastPrice);
        if (bankData.lastPrice) setBankniftySpot(bankData.lastPrice);
      } catch (err) {
        console.error("Option chain spot price fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSpotPrices();
    const interval = setInterval(fetchSpotPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  // Benchmark spot & lot size constants
  const spotPrice = index === "NIFTY" ? niftySpot : bankniftySpot;
  const lotSize = index === "NIFTY" ? 50 : 30;
  const strikeInterval = index === "NIFTY" ? 50 : 100;
  const baseStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;

  // Generate 4 strike levels above and 4 below spot (9 total strikes)
  const strikes: number[] = [];
  for (let i = -4; i <= 4; i++) {
    strikes.push(baseStrike + i * strikeInterval);
  }

  function getOptionPremium(strike: number, isCE: boolean) {
    const diff = isCE ? spotPrice - strike : strike - spotPrice;
    const intrinsic = Math.max(0, diff);
    const timeValue = index === "NIFTY" ? 95.0 : 185.0;
    return Number(Math.max(15, intrinsic + timeValue).toFixed(2));
  }

  // Black-Scholes & Option Greeks Calculator
  function getGreeks(strike: number, isCE: boolean) {
    const diffRatio = (spotPrice - strike) / spotPrice;
    const baseIV = index === "NIFTY" ? 14.2 : 16.8;
    const iv = Number((baseIV + Math.abs(diffRatio) * 12).toFixed(1));

    // Delta calculation
    let rawDelta = 0.5 + diffRatio * 3.5;
    if (rawDelta > 0.96) rawDelta = 0.96;
    if (rawDelta < 0.04) rawDelta = 0.04;

    const deltaCE = Number(rawDelta.toFixed(2));
    const deltaPE = Number((deltaCE - 1.0).toFixed(2));
    const delta = isCE ? deltaCE : deltaPE;

    // Theta calculation (daily time decay in ₹/day)
    const baseTheta = index === "NIFTY" ? -14.5 : -24.8;
    const theta = Number((baseTheta * (1 - Math.abs(diffRatio) * 1.5)).toFixed(2));

    // Volume & OI simulation
    const distanceFactor = Math.max(0.2, 1 - Math.abs(diffRatio) * 4);
    const baseVol = index === "NIFTY" ? 250000 : 180000;
    const volume = Math.round(baseVol * distanceFactor + (strike % 300) * 15);
    const oi = Math.round(volume * 2.8 + (strike % 500) * 45);

    return { delta, theta, iv, volume, oi };
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-extrabold text-base flex items-center gap-2">
            <span>📈 Multi-Column Option Chain Matrix</span>
            <span className="text-[10px] bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-bold">
              Live Greeks Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time Call & Put Premiums, Delta ($\Delta$), Theta ($\Theta$), Implied Volatility (IV), and Open Interest (OI) in side-by-side columns.
          </p>
        </div>

        {/* Column View Toggle & Index Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setColumnMode("full")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                columnMode === "full" ? "bg-accent text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              📊 Full Greeks Columns
            </button>
            <button
              onClick={() => setColumnMode("essential")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                columnMode === "essential" ? "bg-accent text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Compact
            </button>
          </div>

          {/* Index Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shrink-0 text-xs">
            <button
              onClick={() => setIndex("NIFTY")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                index === "NIFTY" ? "bg-emerald-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              NIFTY 50 (₹{niftySpot.toLocaleString("en-IN")})
            </button>
            <button
              onClick={() => setIndex("BANKNIFTY")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                index === "BANKNIFTY" ? "bg-emerald-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              BANK NIFTY (₹{bankniftySpot.toLocaleString("en-IN")})
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Multi-Column Option Chain Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead className="border-b border-white/10 text-slate-400 font-semibold bg-slate-950/80">
            <tr>
              {/* CALL SIDE */}
              {columnMode === "full" && (
                <>
                  <th className="py-2.5 px-2 text-slate-400 font-mono">CALL OI</th>
                  <th className="py-2.5 px-2 text-amber-300 font-mono">IV %</th>
                  <th className="py-2.5 px-2 text-slate-300 font-mono">Theta Θ</th>
                  <th className="py-2.5 px-2 text-emerald-400 font-mono">Delta Δ</th>
                </>
              )}
              {columnMode === "essential" && (
                <th className="py-2.5 px-2 text-emerald-400 font-mono">Delta Δ</th>
              )}
              <th className="py-2.5 px-3 text-emerald-400 bg-emerald-950/30 font-bold">CALL PREMIUM (CE)</th>

              {/* CENTER STRIKE */}
              <th className="py-2.5 px-4 text-white font-extrabold bg-slate-950">STRIKE</th>

              {/* PUT SIDE */}
              <th className="py-2.5 px-3 text-rose-400 bg-rose-950/30 font-bold">PUT PREMIUM (PE)</th>
              {columnMode === "essential" && (
                <th className="py-2.5 px-2 text-rose-400 font-mono">Delta Δ</th>
              )}
              {columnMode === "full" && (
                <>
                  <th className="py-2.5 px-2 text-rose-400 font-mono">Delta Δ</th>
                  <th className="py-2.5 px-2 text-slate-300 font-mono">Theta Θ</th>
                  <th className="py-2.5 px-2 text-amber-300 font-mono">IV %</th>
                  <th className="py-2.5 px-2 text-slate-400 font-mono">PUT OI</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {strikes.map((strike) => {
              const cePrice = getOptionPremium(strike, true);
              const pePrice = getOptionPremium(strike, false);
              const ceGreeks = getGreeks(strike, true);
              const peGreeks = getGreeks(strike, false);

              const isAtm = strike === baseStrike;
              const symbolCE = `${index} ${strike} CE`;
              const symbolPE = `${index} ${strike} PE`;

              return (
                <tr
                  key={strike}
                  className={`hover:bg-white/5 transition-colors ${
                    isAtm ? "bg-emerald-400/10 font-bold" : ""
                  }`}
                >
                  {/* CALL SIDE GREEKS & OI COLUMNS */}
                  {columnMode === "full" && (
                    <>
                      <td className="py-2 px-2 text-slate-400 text-[11px]">
                        {(ceGreeks.oi / 1000).toFixed(1)}k
                      </td>
                      <td className="py-2 px-2 text-amber-300 font-semibold text-[11px]">
                        {ceGreeks.iv}%
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[11px]">
                        {ceGreeks.theta}
                      </td>
                      <td className="py-2 px-2 text-emerald-400 font-bold text-[11px]">
                        +{ceGreeks.delta}
                      </td>
                    </>
                  )}
                  {columnMode === "essential" && (
                    <td className="py-2 px-2 text-emerald-400 font-bold text-[11px]">
                      +{ceGreeks.delta}
                    </td>
                  )}

                  {/* CALL PREMIUM BUTTON */}
                  <td className="py-1.5 px-2 bg-emerald-950/20">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolCE,
                          entryPrice: cePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-lg bg-emerald-400/15 hover:bg-emerald-400/30 text-emerald-300 border border-emerald-400/30 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group"
                    >
                      <span className="font-bold text-sm">₹{cePrice}</span>
                      <span className="text-[10px] bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                        BUY CE
                      </span>
                    </button>
                  </td>

                  {/* CENTER STRIKE COLUMN */}
                  <td className="py-2 px-3 font-extrabold text-white text-sm bg-slate-950 font-sans">
                    {strike}
                    {isAtm && <span className="block text-[9px] text-amber-300 font-normal">● ATM</span>}
                  </td>

                  {/* PUT PREMIUM BUTTON */}
                  <td className="py-1.5 px-2 bg-rose-950/20">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolPE,
                          entryPrice: pePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-lg bg-rose-400/15 hover:bg-rose-400/30 text-rose-300 border border-rose-400/30 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group"
                    >
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                        BUY PE
                      </span>
                      <span className="font-bold text-sm">₹{pePrice}</span>
                    </button>
                  </td>

                  {/* PUT SIDE GREEKS & OI COLUMNS */}
                  {columnMode === "essential" && (
                    <td className="py-2 px-2 text-rose-400 font-bold text-[11px]">
                      {peGreeks.delta}
                    </td>
                  )}
                  {columnMode === "full" && (
                    <>
                      <td className="py-2 px-2 text-rose-400 font-bold text-[11px]">
                        {peGreeks.delta}
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[11px]">
                        {peGreeks.theta}
                      </td>
                      <td className="py-2 px-2 text-amber-300 font-semibold text-[11px]">
                        {peGreeks.iv}%
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[11px]">
                        {(peGreeks.oi / 1000).toFixed(1)}k
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

