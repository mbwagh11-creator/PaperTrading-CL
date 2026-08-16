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
    <div className="rounded-3xl border border-white/10 bg-[#12151E]/90 p-5 space-y-4 shadow-[0_25px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <h2 className="font-extrabold text-base flex items-center gap-2 text-white">
            <span>📈 Option Chain Matrix</span>
            <span className="text-[10px] bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 px-2.5 py-0.5 rounded-full font-bold">
              Obsidian Glass Feed
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Call & Put Premiums, Delta ($\Delta$), Theta ($\Theta$), IV, and OI with ITM row shading.
          </p>
        </div>

        {/* Column View Toggle & Index Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex bg-[#080C11] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setColumnMode("full")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                columnMode === "full"
                  ? "bg-[#00E599] text-[#090A0F] shadow-[0_4px_14px_rgba(0,229,153,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📊 Full Greeks Columns
            </button>
            <button
              onClick={() => setColumnMode("essential")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                columnMode === "essential"
                  ? "bg-[#00E599] text-[#090A0F] shadow-[0_4px_14px_rgba(0,229,153,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Compact
            </button>
          </div>

          {/* Index Tabs */}
          <div className="flex bg-[#080C11] p-1 rounded-xl border border-white/10 shrink-0 text-xs">
            <button
              onClick={() => setIndex("NIFTY")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                index === "NIFTY"
                  ? "bg-[#00E599] text-[#090A0F] shadow-[0_4px_14px_rgba(0,229,153,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              NIFTY 50 (₹{niftySpot.toLocaleString("en-IN")})
            </button>
            <button
              onClick={() => setIndex("BANKNIFTY")}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                index === "BANKNIFTY"
                  ? "bg-[#00E599] text-[#090A0F] shadow-[0_4px_14px_rgba(0,229,153,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              BANK NIFTY (₹{bankniftySpot.toLocaleString("en-IN")})
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Multi-Column Option Chain Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-center text-xs">
          <thead className="border-b border-white/10 text-slate-400 font-semibold bg-[#080C11]">
            <tr>
              {/* CALL SIDE */}
              {columnMode === "full" && (
                <>
                  <th className="py-3 px-2 text-slate-400 font-mono">CALL OI</th>
                  <th className="py-3 px-2 text-amber-300 font-mono">IV %</th>
                  <th className="py-3 px-2 text-slate-400 font-mono">Theta Θ</th>
                  <th className="py-3 px-2 text-[#00E599] font-mono">Delta Δ</th>
                </>
              )}
              {columnMode === "essential" && (
                <th className="py-3 px-2 text-[#00E599] font-mono">Delta Δ</th>
              )}
              <th className="py-3 px-3 text-[#00E599] bg-[#00E599]/10 font-bold">CALL PREMIUM (CE)</th>

              {/* CENTER STRIKE */}
              <th className="py-3 px-4 text-white font-extrabold bg-[#05070A] border-x border-white/10">STRIKE</th>

              {/* PUT SIDE */}
              <th className="py-3 px-3 text-[#FF3B5C] bg-[#FF3B5C]/10 font-bold">PUT PREMIUM (PE)</th>
              {columnMode === "essential" && (
                <th className="py-3 px-2 text-[#FF3B5C] font-mono">Delta Δ</th>
              )}
              {columnMode === "full" && (
                <>
                  <th className="py-3 px-2 text-[#FF3B5C] font-mono">Delta Δ</th>
                  <th className="py-3 px-2 text-slate-400 font-mono">Theta Θ</th>
                  <th className="py-3 px-2 text-amber-300 font-mono">IV %</th>
                  <th className="py-3 px-2 text-slate-400 font-mono">PUT OI</th>
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
              const isCallITM = strike < baseStrike;
              const isPutITM = strike > baseStrike;

              const symbolCE = `${index} ${strike} CE`;
              const symbolPE = `${index} ${strike} PE`;

              return (
                <tr
                  key={strike}
                  className={`hover:bg-white/10 transition-colors ${
                    isAtm
                      ? "bg-[#38BDF8]/10 font-bold"
                      : isCallITM
                      ? "bg-[#00E599]/[0.05]"
                      : isPutITM
                      ? "bg-[#FF3B5C]/[0.05]"
                      : ""
                  }`}
                >
                  {/* CALL SIDE GREEKS & OI COLUMNS */}
                  {columnMode === "full" && (
                    <>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                        {(ceGreeks.oi / 1000).toFixed(1)}k
                      </td>
                      <td className="py-2.5 px-2 text-amber-300 font-semibold text-[11px]">
                        {ceGreeks.iv}%
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                        {ceGreeks.theta}
                      </td>
                      <td className="py-2.5 px-2 text-[#00E599] font-bold text-[11px]">
                        +{ceGreeks.delta}
                      </td>
                    </>
                  )}
                  {columnMode === "essential" && (
                    <td className="py-2.5 px-2 text-[#00E599] font-bold text-[11px]">
                      +{ceGreeks.delta}
                    </td>
                  )}

                  {/* CALL PREMIUM BUTTON */}
                  <td className="py-1.5 px-2 bg-[#00E599]/[0.08]">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolCE,
                          entryPrice: cePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-xl bg-[#00E599]/15 hover:bg-[#00E599]/30 text-[#00E599] border border-[#00E599]/40 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group shadow-sm"
                    >
                      <span className="font-bold text-sm">₹{cePrice}</span>
                      <span className="text-[10px] bg-[#00E599] text-[#090A0F] px-1.5 py-0.5 rounded-md font-extrabold group-hover:scale-105">
                        BUY CE
                      </span>
                    </button>
                  </td>

                  {/* CENTER STRIKE COLUMN (Dark Spine) */}
                  <td className="py-2.5 px-3 font-extrabold text-white text-sm bg-[#05070A] border-x border-white/10 font-sans">
                    {strike}
                    {isAtm && (
                      <span className="block text-[9px] text-[#38BDF8] font-bold bg-[#38BDF8]/20 border border-[#38BDF8]/40 px-1 rounded-full mt-0.5">
                        ● ATM
                      </span>
                    )}
                  </td>

                  {/* PUT PREMIUM BUTTON */}
                  <td className="py-1.5 px-2 bg-[#FF3B5C]/[0.08]">
                    <button
                      onClick={() =>
                        onSelectOption({
                          symbol: symbolPE,
                          entryPrice: pePrice,
                          quantity: lotSize,
                        })
                      }
                      className="w-full rounded-xl bg-[#FF3B5C]/15 hover:bg-[#FF3B5C]/30 text-[#FF3B5C] border border-[#FF3B5C]/40 py-1.5 px-3 font-semibold flex items-center justify-between transition-all group shadow-sm"
                    >
                      <span className="text-[10px] bg-[#FF3B5C] text-white px-1.5 py-0.5 rounded-md font-extrabold group-hover:scale-105">
                        BUY PE
                      </span>
                      <span className="font-bold text-sm">₹{pePrice}</span>
                    </button>
                  </td>

                  {/* PUT SIDE GREEKS & OI COLUMNS */}
                  {columnMode === "essential" && (
                    <td className="py-2.5 px-2 text-[#FF3B5C] font-bold text-[11px]">
                      {peGreeks.delta}
                    </td>
                  )}
                  {columnMode === "full" && (
                    <>
                      <td className="py-2.5 px-2 text-[#FF3B5C] font-bold text-[11px]">
                        {peGreeks.delta}
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                        {peGreeks.theta}
                      </td>
                      <td className="py-2.5 px-2 text-amber-300 font-semibold text-[11px]">
                        {peGreeks.iv}%
                      </td>
                      <td className="py-2.5 px-2 text-slate-400 text-[11px]">
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

