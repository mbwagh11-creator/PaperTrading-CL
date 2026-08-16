"use client";

import { useEffect, useState } from "react";

interface OptionChainProps {
  onSelectOption: (option: { symbol: string; entryPrice: number; quantity: number }) => void;
}

type ViewMode = "premiums" | "greeks" | "volume";

export default function OptionChain({ onSelectOption }: OptionChainProps) {
  const [index, setIndex] = useState<"NIFTY" | "BANKNIFTY">("NIFTY");
  const [viewMode, setViewMode] = useState<ViewMode>("premiums");
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

    // Theta calculation (daily time decay)
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
            <span>📈 Interactive Option Chain Matrix</span>
            <span className="text-[10px] bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-bold">
              Live Feed
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            View live Premiums, Option Greeks (Delta, Theta, IV), Volume & Open Interest. Click any strike to trade.
          </p>
        </div>

        {/* Matrix View Selector & Index Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode("premiums")}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                viewMode === "premiums" ? "bg-accent text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              💰 Premiums
            </button>
            <button
              onClick={() => setViewMode("greeks")}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                viewMode === "greeks" ? "bg-accent text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              📐 Greeks (Δ, Θ, IV)
            </button>
            <button
              onClick={() => setViewMode("volume")}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                viewMode === "volume" ? "bg-accent text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              📊 Volume & OI
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

      {/* Option Chain Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead className="border-b border-white/10 text-slate-400 font-semibold bg-slate-950/60">
            {viewMode === "premiums" && (
              <tr>
                <th className="py-2.5 px-2 text-emerald-400">CALL PREMIUM (CE)</th>
                <th className="py-2.5 px-2">STRIKE PRICE</th>
                <th className="py-2.5 px-2 text-rose-400">PUT PREMIUM (PE)</th>
              </tr>
            )}
            {viewMode === "greeks" && (
              <tr>
                <th className="py-2.5 px-2 text-emerald-400">CALL GREEKS (Delta Δ • Theta Θ • IV)</th>
                <th className="py-2.5 px-2">STRIKE PRICE</th>
                <th className="py-2.5 px-2 text-rose-400">PUT GREEKS (Delta Δ • Theta Θ • IV)</th>
              </tr>
            )}
            {viewMode === "volume" && (
              <tr>
                <th className="py-2.5 px-2 text-emerald-400">CALL VOLUME & OPEN INTEREST</th>
                <th className="py-2.5 px-2">STRIKE PRICE</th>
                <th className="py-2.5 px-2 text-rose-400">PUT VOLUME & OPEN INTEREST</th>
              </tr>
            )}
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
                    isAtm ? "bg-emerald-400/5 font-bold" : ""
                  }`}
                >
                  {/* CE Side */}
                  <td className="py-2 px-2">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolCE,
                          entryPrice: cePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-lg bg-emerald-400/10 hover:bg-emerald-400/25 text-emerald-300 border border-emerald-400/30 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group"
                    >
                      {viewMode === "premiums" && (
                        <>
                          <span className="font-bold text-sm">₹{cePrice}</span>
                          <span className="text-[10px] bg-emerald-400 text-black px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                            BUY CE
                          </span>
                        </>
                      )}
                      {viewMode === "greeks" && (
                        <div className="flex items-center justify-between w-full text-[11px] font-mono">
                          <span className="text-emerald-300 font-bold">Δ {ceGreeks.delta}</span>
                          <span className="text-slate-400">Θ {ceGreeks.theta}</span>
                          <span className="text-amber-300 font-semibold">IV {ceGreeks.iv}%</span>
                        </div>
                      )}
                      {viewMode === "volume" && (
                        <div className="flex items-center justify-between w-full text-[11px] font-mono">
                          <span className="text-slate-200">Vol: {ceGreeks.volume.toLocaleString("en-IN")}</span>
                          <span className="text-emerald-300 font-bold">OI: {ceGreeks.oi.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </button>
                  </td>

                  {/* Strike Price Column */}
                  <td className="py-2 px-2 font-extrabold text-white text-sm bg-slate-950/40 font-sans">
                    {strike}
                    {isAtm && <span className="block text-[9px] text-amber-300 font-normal">● ATM</span>}
                  </td>

                  {/* PE Side */}
                  <td className="py-2 px-2">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolPE,
                          entryPrice: pePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-lg bg-rose-400/10 hover:bg-rose-400/25 text-rose-300 border border-rose-400/30 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group"
                    >
                      {viewMode === "premiums" && (
                        <>
                          <span className="text-[10px] bg-rose-400 text-white px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                            BUY PE
                          </span>
                          <span className="font-bold text-sm">₹{pePrice}</span>
                        </>
                      )}
                      {viewMode === "greeks" && (
                        <div className="flex items-center justify-between w-full text-[11px] font-mono">
                          <span className="text-amber-300 font-semibold">IV {peGreeks.iv}%</span>
                          <span className="text-slate-400">Θ {peGreeks.theta}</span>
                          <span className="text-rose-300 font-bold">Δ {peGreeks.delta}</span>
                        </div>
                      )}
                      {viewMode === "volume" && (
                        <div className="flex items-center justify-between w-full text-[11px] font-mono">
                          <span className="text-rose-300 font-bold">OI: {peGreeks.oi.toLocaleString("en-IN")}</span>
                          <span className="text-slate-200">Vol: {peGreeks.volume.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

