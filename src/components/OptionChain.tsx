"use client";

import { useState } from "react";

interface OptionChainProps {
  onSelectOption: (option: { symbol: string; entryPrice: number; quantity: number }) => void;
}

export default function OptionChain({ onSelectOption }: OptionChainProps) {
  const [index, setIndex] = useState<"NIFTY" | "BANKNIFTY">("NIFTY");

  // Benchmark spot & lot size constants
  const spotPrice = index === "NIFTY" ? 24366.0 : 52240.0;
  const lotSize = index === "NIFTY" ? 50 : 30;
  const strikeInterval = index === "NIFTY" ? 50 : 100;
  const baseStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;

  // Generate 5 strike levels above and below spot
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

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-extrabold text-base flex items-center gap-2">
            <span>📈 Interactive Option Chain Matrix</span>
            <span className="text-[10px] bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-bold">
              1-Click Trade
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any Call (CE) or Put (PE) strike premium to instantly load into trade ticket.
          </p>
        </div>

        {/* Index Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setIndex("NIFTY")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              index === "NIFTY" ? "bg-emerald-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            NIFTY 50 (Spot ₹24,366)
          </button>
          <button
            onClick={() => setIndex("BANKNIFTY")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              index === "BANKNIFTY" ? "bg-emerald-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            BANK NIFTY (Spot ₹52,240)
          </button>
        </div>
      </div>

      {/* Option Chain Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead className="border-b border-white/10 text-slate-400 font-semibold bg-slate-950/60">
            <tr>
              <th className="py-2.5 px-2 text-emerald-400">CALL PREMIUM (CE)</th>
              <th className="py-2.5 px-2">STRIKE PRICE</th>
              <th className="py-2.5 px-2 text-rose-400">PUT PREMIUM (PE)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {strikes.map((strike) => {
              const cePrice = getOptionPremium(strike, true);
              const pePrice = getOptionPremium(strike, false);
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
                      <span>₹{cePrice}</span>
                      <span className="text-[10px] bg-emerald-400 text-black px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                        BUY CE
                      </span>
                    </button>
                  </td>

                  {/* Strike Price */}
                  <td className="py-2 px-2 font-extrabold text-white text-sm bg-slate-950/40">
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
                      <span className="text-[10px] bg-rose-400 text-white px-1.5 py-0.5 rounded font-bold group-hover:scale-105">
                        BUY PE
                      </span>
                      <span>₹{pePrice}</span>
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
