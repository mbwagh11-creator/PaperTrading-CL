"use client";

import { useState } from "react";
import Link from "next/link";

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  summary: string;
  quote?: string;
  keyTakeaways: string[];
}

const chapters: Chapter[] = [
  {
    id: 1,
    title: "Chapter 1: Real-World Proof First — The FXCM Study",
    subtitle: "Why 61% Win Rate Traders Still Lose Money",
    summary:
      "Analyzes broker research across millions of retail trades. Retail traders won 61% of EUR/USD trades (averaging 48 pips profit), but their losing trades averaged 83 pips (70% larger than wins), resulting in an average EV of -3.09 pips per trade.",
    quote: "Being right most of the time is not the same as making money most of the time — that is why this notebook refuses to assume more than a coin-toss-level hit rate, and asks the ratio to do the real work instead.",
    keyTakeaways: [
      "Retail traders win most individual trades (61%), yet lose money overall.",
      "Uncontrolled loss sizes quietly destroy high win rates.",
      "Holding a minimum 1:1 profit ratio makes traders 3x more likely to profit.",
    ],
  },
  {
    id: 2,
    title: "Chapter 2: The Shape of a Single Trade",
    subtitle: "The Core Math: 2:1 Reward to Risk Ratio",
    summary:
      "Defines a single trade model: 2:1 profit-to-loss ratio (Win +₹1,000, Loss -₹500), 50% hit rate, and flat ₹100 cost per trade. Net Win = +₹900, Net Loss = -₹600. Single Trade EV = 0.5×(+900) + 0.5×(-600) = +₹150 per trade.",
    quote: "This single number (+₹150) is the quiet engine of everything that follows.",
    keyTakeaways: [
      "Gross Win = ₹1,000 | Gross Loss = ₹500 | Flat Overhead Cost = ₹100.",
      "Net Win = +₹900 | Net Loss = -₹600.",
      "Expected Value (EV) = +₹150 per trade taken over time.",
    ],
  },
  {
    id: 3,
    title: "Chapter 3: Why Traders Chase Hit Rate",
    subtitle: "The Emotional Trap of Win Frequency",
    summary:
      "Explores why traders emotionally fixate on win rate. Shows how a 90% win rate system that risks ₹900 to make ₹100 has an EV of ₹0 before costs, and turns negative after flat costs.",
    quote: "Hit rate alone, without its paired ratio, tells a trader almost nothing about whether a system is actually profitable.",
    keyTakeaways: [
      "Win rate is emotionally visible; profit ratio rewards patience in aggregate.",
      "High hit rates often mask catastrophic risk-to-reward ratios.",
      "Never judge a system by win rate alone without knowing the reward ratio.",
    ],
  },
  {
    id: 4,
    title: "Chapter 4: The Ceiling — Why 50% Is Already Near the Top",
    subtitle: "The 40% Breakeven Threshold",
    summary:
      "Short-term price action in liquid indices like BankNifty behaves close to a random walk. Durable directional systems cap at 40-50% win rates. Solves breakeven hit rate: p × 900 = (1-p) × 600 ⇒ p = 40%.",
    quote: "The 50% hit rate used across this notebook is close to the realistic ceiling for this kind of trade, with a comfortable 40% breakeven cushion.",
    keyTakeaways: [
      "Short-duration option setups structurally cap near 40%-50% hit rate.",
      "The 2:1 system breaks even at just 40% win rate.",
      "Focusing on ratio discipline protects capital when hit rate fluctuates.",
    ],
  },
  {
    id: 5,
    title: "Chapter 5: What Actually Moves the Needle: Entries, Exits, Ratio",
    subtitle: "Ratio Is More Elastic Than Prediction",
    summary:
      "Compares 1.5:1 ratio vs 2:1 ratio over 20 trading days. At 50% hit rate, 1.5:1 ratio yields ₹500/mo while 2:1 ratio yields ₹3,000/mo — 6x profit from the exact same direction calling skill!",
    quote: "Fix the ratio first. Let the hit rate be whatever the market honestly gives you — 40%, 50%, it does not matter, as long as the edge is positive.",
    keyTakeaways: [
      "Time spent tightening stop-loss discipline yields higher returns than predicting direction.",
      "Moving from 1.5:1 to 2:1 increases monthly returns by 600%.",
      "Always secure a minimum 1:2 risk-reward ratio on technical entries.",
    ],
  },
  {
    id: 6,
    title: "Chapter 6: Three Ways to Stop — The Conditional Ladder",
    subtitle: "Stopping Rules & Multi-Trade EV",
    summary:
      "Analyzes daily stopping structures: 1 trade/day (EV +₹150), 2 trades/day stop on win (EV +₹225), and 3 trades/day stop after 2 wins (EV +₹262.50). 3 trades/day conditional ladder gives an 87.5% win-day probability.",
    keyTakeaways: [
      "Allowing up to 3 conditional trades increases expected monthly EV to +₹5,250.",
      "Daily win probability reaches 87.5% with a conditional ladder.",
      "Worst day capped at -₹1,800.",
    ],
  },
  {
    id: 7,
    title: "Chapter 7: What Happens When You Never Stop",
    subtitle: "The Unconditional 3-Trade System",
    summary:
      "Tests taking all trades regardless of win/loss. Taking all 2 trades yields EV +₹300 (+₹6,000/mo). Taking all 3 trades yields EV +₹450 (+₹9,000/mo).",
    quote: "Because every trade carries the identical, independent ₹150 edge, expected profit scales with raw trade count taken.",
    keyTakeaways: [
      "Stopping after a win forfeits positive-EV opportunities on good days.",
      "Unconditional 3 trades/day doubles monthly expected value to +₹9,000.",
    ],
  },
  {
    id: 8,
    title: "Chapter 8: A Softer Edge — Testing a 1.5:1 Ratio",
    subtitle: "The High Cost of Accepts Thinner Rewards",
    summary:
      "Tests 1.5:1 ratio (Win ₹750, Loss ₹500, Cost ₹100). Net Win = +₹650, Net Loss = -₹600. Single trade EV drops to +₹25 (a 6th of 2:1 ratio). Worst day remains identical (-₹1,800) but monthly EV drops from ₹5,250 to ₹875.",
    quote: "A weaker ratio does not make the storm smaller. It only makes the harvest thinner.",
    keyTakeaways: [
      "Accepting lower risk-reward ratio does not reduce worst-day drawdown risk.",
      "Softer ratios dramatically reduce monthly profit potential for the same risk.",
    ],
  },
  {
    id: 9,
    title: "Chapter 9: Returning to 2:1, and Counting by the Month",
    subtitle: "Full 20-Day Monthly Comparison Ledger",
    summary:
      "Compiles all 2:1 ratio daily structures over a 20-day trading month. Always 3 trades/day produces +₹9,000 monthly EV with an 87.5% win-day probability.",
    keyTakeaways: [
      "Monthly EV acts as a gravitational center for trade distribution.",
      "Taking 3 trades/day achieves +₹9,000 monthly EV across 20 trading days.",
    ],
  },
  {
    id: 10,
    title: "Chapter 10: Lot Size and the Cost Floor",
    subtitle: "How Lot Sizing Dilutes Fixed Overhead Fees",
    summary:
      "Shows how a flat ₹100 fee per trade impacts 1-lot, 2-lot, and 3-lot positions. 1 lot fee eats 20% of gross win (EV +₹25). 2 lots fee eats 10% (EV +₹150). 3 lots fee eats 6.7% (EV +₹275).",
    quote: "A trader operating near minimum lot size is fighting cost drag on top of market risk. Sizing up dilutes fixed overhead.",
    keyTakeaways: [
      "Fixed brokerage/slippage fees eat 20% of profits on 1-lot positions.",
      "Sizing to 3-lots dilutes cost drag to 6.7%, boosting single trade EV to +₹275.",
      "Position sizing should be optimized to reduce cost drag without over-leveraging.",
    ],
  },
  {
    id: 11,
    title: "Chapter 11: The Middle Path — A Conditional Third Trade",
    subtitle: "The Hybrid 3-Lot Strategy",
    summary:
      "Tests taking 2 trades always, and taking a 3rd trade ONLY if the first two lost (LL). Using 3-lot sizing: Daily EV = +₹618.75, Monthly EV = +₹12,375 across 20 days.",
    keyTakeaways: [
      "Hybrid approach: Always take 2 trades; take 3rd trade only after 2 consecutive losses.",
      "Achieves +₹12,375 monthly EV while limiting unnecessary market exposure on winning days.",
    ],
  },
  {
    id: 12,
    title: "Chapter 12: The Argument for No Ceiling",
    subtitle: "Setup Availability vs Trade Count Limits",
    summary:
      "Analyzes whether trade counts should be capped at 3. Argues that any valid positive-EV setup should be taken, but cautions against overtrading during regime shifts.",
    quote: "The theoretical ceiling isn't three — it is however many valid setups exist.",
    keyTakeaways: [
      "Every valid setup carries positive expected value.",
      "Daily limits prevent emotional overtrading during choppy market shifts.",
    ],
  },
  {
    id: 13,
    title: "Chapter 13: Three Setups a Day — The Chosen Plan",
    subtitle: "The Master Execution Strategy",
    summary:
      "Final chosen framework: 3 valid setups/day, 3-lot position sizing, 2:1 reward ratio. Daily EV = +₹825 | Monthly EV (20 days) = +₹16,500 | Win-Days = 87.5% | Worst Single Day = -₹2,550.",
    keyTakeaways: [
      "Recommended Strategy: 3 setups per day, 3-lot sizing, no early exit on win.",
      "Expected Monthly Net Return: +₹16,500 on ₹1,000 risk unit.",
      "Win-Day Rate: 87.5% of trading days close in the green.",
    ],
  },
  {
    id: 14,
    title: "Chapter 14: Guarding Against the Day the Math Breaks",
    subtitle: "Streak-Based Cool-Off Safeguards",
    summary:
      "Protects against market regime changes. Rule: If 2 consecutive full-loss days (LLL + LLL) occur (1.56% probability), pause trading for 1 cool-off day. Maintains 99% of monthly EV (+₹16,300) while guarding against tail risk.",
    quote: "A single bad day is the price of the edge. Two bad days in a row is a question worth asking.",
    keyTakeaways: [
      "Single full-loss day (0-3) occurs ~2.5 days/month (12.5%).",
      "Two full-loss days in a row occurs only 1.56% of the time.",
      "Cool-off safeguard after 2 LLL days preserves +₹16,300 monthly EV while shielding capital.",
    ],
  },
];

export default function BookClient() {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const pdfUrl = "/books/The_Mathematics_of_the_Third_Trade.pdf";

  const activeChap = chapters.find((c) => c.id === selectedChapter) || chapters[0];

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto px-4">
      {/* Hero Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          📘 Exclusive Trading Research Notebook (July 2026 Edition)
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          THE MATHEMATICS OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">THE THIRD TRADE</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
          An Expected Value Study of Hit Rate, Ratio, Cost, and Conditional Trade–Stacking in BankNifty Options. Read the complete 14-chapter interactive notebook below or download the PDF.
        </p>
      </div>

      {/* Compliance Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-200/90 leading-relaxed max-w-4xl mx-auto">
        ⚠️ <strong>Educational Purpose & SEBI Disclaimer:</strong> This research notebook is strictly for educational, mathematical modeling, and paper-trading practice. PRO-TRADER does not guarantee profits, provide stock recommendations, or act as a SEBI registered entity.
      </div>

      {/* E-Book Quick Download Bar */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-md">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
            📖 Digital PDF Research Notebook (28 Pages)
          </h2>
          <p className="text-xs text-slate-300">
            Format: High-Res PDF • Size: ~2.4 MB • Free Access for PRO-TRADER Members
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-black font-extrabold text-xs px-5 py-3 rounded-xl hover:brightness-105 transition-all shadow-[0_4px_14px_rgba(97,255,201,0.2)] flex items-center gap-2"
          >
            👁️ Open PDF In Browser
          </a>
          <a
            href={pdfUrl}
            download="The-Mathematics-Of-The-Third-Trade.pdf"
            className="bg-white/10 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
          >
            📥 Download PDF Book
          </a>
        </div>
      </div>



      {/* Interactive 14-Chapter Digital Reader */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Left Sidebar Chapter Selector */}
        <div className="md:col-span-4 space-y-2 rounded-2xl border border-white/10 bg-slate-950 p-4 h-[650px] overflow-y-auto">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-2">
            📚 Table of Contents (14 Chapters)
          </h3>
          <div className="space-y-1">
            {chapters.map((chap) => (
              <button
                key={chap.id}
                onClick={() => setSelectedChapter(chap.id)}
                className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                  selectedChapter === chap.id
                    ? "bg-accent text-black font-bold shadow-md"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="font-mono font-bold shrink-0">Ch.{chap.id}</span>
                <span className="line-clamp-2">{chap.title.split(":")[1] || chap.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Active Chapter Detail Display */}
        <div className="md:col-span-8 rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-white/10 pb-4">
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">
                Chapter {activeChap.id} of 14
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{activeChap.title}</h2>
              <p className="text-xs text-emerald-400 font-semibold">{activeChap.subtitle}</p>
            </div>

            {/* Chapter Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter Summary</h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
                {activeChap.summary}
              </p>
            </div>

            {/* Chapter Quote if available */}
            {activeChap.quote && (
              <div className="border-l-4 border-accent bg-accent/10 p-4 rounded-r-xl italic text-xs text-accent/90 font-medium">
                "{activeChap.quote}"
              </div>
            )}

            {/* Key Takeaways */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Takeaways</h4>
              <ul className="space-y-2">
                {activeChap.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chapter Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              disabled={selectedChapter === 1}
              onClick={() => setSelectedChapter((prev) => Math.max(1, prev - 1))}
              className="text-xs bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/10 disabled:opacity-30"
            >
              ← Previous Chapter
            </button>
            <span className="text-xs text-muted font-mono">
              {selectedChapter} / 14
            </span>
            <button
              disabled={selectedChapter === 14}
              onClick={() => setSelectedChapter((prev) => Math.min(14, prev + 1))}
              className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl hover:bg-emerald-500/30 disabled:opacity-30"
            >
              Next Chapter →
            </button>
          </div>
        </div>
      </div>

      {/* Embedded PDF Viewer Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📄 Full Original 28-Page PDF Notebook
          </h3>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            Open in New Window ↗
          </a>
        </div>
        <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950 h-[650px] w-full">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            className="w-full h-full border-none"
            title="The Mathematics of The Third Trade PDF Reader"
          />
        </div>
      </div>
    </div>
  );
}
