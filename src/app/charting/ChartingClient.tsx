"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChartCanvas, { DrawingType, DrawingItem, PracticeTrade } from "./ChartCanvas";
import { Candle } from "../api/market/history/route";

const POPULAR_SYMBOLS = [
  { symbol: "NIFTY", name: "NIFTY 50 Index" },
  { symbol: "BANKNIFTY", name: "NIFTY Bank Index" },
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "INFY", name: "Infosys Ltd" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BTC-USD", name: "Bitcoin / USD" },
  { symbol: "TSLA", name: "Tesla Inc" },
];

const TIMEFRAMES = [
  { label: "1m", interval: "1m", range: "1d" },
  { label: "5m", interval: "5m", range: "5d" },
  { label: "15m", interval: "15m", range: "5d" },
  { label: "1h", interval: "1h", range: "1mo" },
  { label: "1D", interval: "1d", range: "3mo" },
];

export default function ChartingClient() {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[1]); // 5m default
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tool & Drawings
  const [activeTool, setActiveTool] = useState<DrawingType>("CURSOR");
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);

  // Indicators toggle
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema9: false,
    vwap: true,
    bollinger: false,
  });

  // Replay Mode State
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayIndex, setReplayIndex] = useState(200); // visible candles count
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per step

  // Practice Trading in Replay
  const [activeTrade, setActiveTrade] = useState<PracticeTrade | null>(null);
  const [tradeHistory, setTradeHistory] = useState<PracticeTrade[]>([]);
  const [tradeQuantity, setTradeQuantity] = useState(50);
  const [tradeSL, setTradeSL] = useState<string>("");
  const [tradeTP, setTradeTP] = useState<string>("");

  const replayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Historical Candles
  const loadCandles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/market/history?symbol=${selectedSymbol}&interval=${selectedTf.interval}&range=${selectedTf.range}`
      );
      const data = await res.json();
      if (data.candles && Array.isArray(data.candles)) {
        setCandles(data.candles);
        setReplayIndex(data.candles.length);
      }
    } catch (err) {
      console.error("Failed to load historical candles:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, selectedTf]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // Replay Step Handler
  const stepForward = useCallback(() => {
    setReplayIndex((prev) => {
      if (prev >= candles.length) {
        setIsPlaying(false);
        return prev;
      }
      const nextIdx = prev + 1;

      // Check practice trade SL / TP hits
      if (activeTrade && activeTrade.status === "OPEN") {
        const currCandle = candles[nextIdx - 1];
        if (currCandle) {
          const high = currCandle.high;
          const low = currCandle.low;
          const isBuy = activeTrade.side === "BUY";

          let closedStatus: PracticeTrade["status"] | null = null;
          let exitP = currCandle.close;

          if (isBuy) {
            if (activeTrade.stopLoss && low <= activeTrade.stopLoss) {
              closedStatus = "CLOSED_SL";
              exitP = activeTrade.stopLoss;
            } else if (activeTrade.takeProfit && high >= activeTrade.takeProfit) {
              closedStatus = "CLOSED_TP";
              exitP = activeTrade.takeProfit;
            }
          } else {
            // SELL
            if (activeTrade.stopLoss && high >= activeTrade.stopLoss) {
              closedStatus = "CLOSED_SL";
              exitP = activeTrade.stopLoss;
            } else if (activeTrade.takeProfit && low <= activeTrade.takeProfit) {
              closedStatus = "CLOSED_TP";
              exitP = activeTrade.takeProfit;
            }
          }

          if (closedStatus) {
            const pnl =
              isBuy
                ? (exitP - activeTrade.entryPrice) * tradeQuantity
                : (activeTrade.entryPrice - exitP) * tradeQuantity;
            const pnlPercent =
              isBuy
                ? ((exitP - activeTrade.entryPrice) / activeTrade.entryPrice) * 100
                : ((activeTrade.entryPrice - exitP) / activeTrade.entryPrice) * 100;

            const closedTrade: PracticeTrade = {
              ...activeTrade,
              status: closedStatus,
              exitPrice: exitP,
              pnl,
              pnlPercent,
            };
            setActiveTrade(null);
            setTradeHistory((h) => [closedTrade, ...h]);
          }
        }
      }

      return nextIdx;
    });
  }, [candles, activeTrade, tradeQuantity]);

  // Replay Timer Loop
  useEffect(() => {
    if (isPlaying && isReplayActive) {
      replayTimerRef.current = setInterval(() => {
        stepForward();
      }, replaySpeed);
    } else {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isPlaying, isReplayActive, replaySpeed, stepForward]);

  // Drawings Handlers
  const handleAddDrawing = (item: DrawingItem) => {
    setDrawings((prev) => [...prev, item]);
    setActiveTool("CURSOR");
  };

  const handleUpdateDrawing = (item: DrawingItem) => {
    setDrawings((prev) => prev.map((d) => (d.id === item.id ? item : d)));
  };

  const handleClearDrawings = () => {
    if (confirm("Clear all drawings from current chart workspace?")) {
      setDrawings([]);
    }
  };

  // Practice Trade Execution Handler
  const handlePlaceOrder = (side: "BUY" | "SELL") => {
    const currentCandle = candles[replayIndex - 1] || candles[candles.length - 1];
    if (!currentCandle) return;

    const entry = currentCandle.close;
    const sl = tradeSL ? parseFloat(tradeSL) : null;
    const tp = tradeTP ? parseFloat(tradeTP) : null;

    const newTrade: PracticeTrade = {
      id: `trade_${Date.now()}`,
      side,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      entryTime: currentCandle.time,
      status: "OPEN",
    };

    setActiveTrade(newTrade);
  };

  const handleCloseActiveTrade = () => {
    if (!activeTrade) return;
    const currentCandle = candles[replayIndex - 1] || candles[candles.length - 1];
    if (!currentCandle) return;

    const exitP = currentCandle.close;
    const isBuy = activeTrade.side === "BUY";
    const pnl = isBuy
      ? (exitP - activeTrade.entryPrice) * tradeQuantity
      : (activeTrade.entryPrice - exitP) * tradeQuantity;
    const pnlPercent = isBuy
      ? ((exitP - activeTrade.entryPrice) / activeTrade.entryPrice) * 100
      : ((activeTrade.entryPrice - exitP) / activeTrade.entryPrice) * 100;

    const closed: PracticeTrade = {
      ...activeTrade,
      status: "CLOSED_MANUAL",
      exitPrice: exitP,
      pnl,
      pnlPercent,
    };

    setActiveTrade(null);
    setTradeHistory((h) => [closed, ...h]);
  };

  const currentCandle = candles[replayIndex - 1] || candles[candles.length - 1];
  const lastPrice = currentCandle ? currentCandle.close : 0;
  const currentUnrealizedPnl = activeTrade
    ? activeTrade.side === "BUY"
      ? (lastPrice - activeTrade.entryPrice) * tradeQuantity
      : (activeTrade.entryPrice - lastPrice) * tradeQuantity
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span className="text-[#00E599]">📊</span> Technical Charting & Bar Replay Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Practice technical tools (Pitchforks, Fibonacci, Support/Resistance Zones) & replay historical bar-by-bar price action.
          </p>
        </div>

        {/* Replay Toggle Button */}
        <button
          onClick={() => {
            setIsReplayActive(!isReplayActive);
            if (!isReplayActive) {
              setReplayIndex(Math.floor(candles.length * 0.5));
            } else {
              setReplayIndex(candles.length);
              setIsPlaying(false);
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
            isReplayActive
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
              : "bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40 hover:bg-[#00E599]/30"
          }`}
        >
          {isReplayActive ? "⏹ Exit Bar Replay Mode" : "⏯ Start Bar Replay Practice"}
        </button>
      </div>

      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 border border-white/10 p-3 rounded-2xl">
        {/* Left: Symbol Selector & Timeframe Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Select */}
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-slate-900 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#00E599]"
          >
            {POPULAR_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} ({s.name})
              </option>
            ))}
          </select>

          {/* Timeframe Pills */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-white/10">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setSelectedTf(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedTf.label === tf.label
                    ? "bg-[#00E599] text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Current Price Badge */}
          {currentCandle && (
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="text-slate-400">{selectedSymbol}:</span>
              <span className="text-emerald-400">₹{currentCandle.close.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Right: Technical Indicators & Clear Canvas */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="font-semibold text-slate-400 mr-1">Indicators:</span>
            <label className="flex items-center gap-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={indicators.sma20}
                onChange={(e) => setIndicators((i) => ({ ...i, sma20: e.target.checked }))}
                className="accent-[#3b82f6]"
              />
              <span>SMA20</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer hover:text-white ml-2">
              <input
                type="checkbox"
                checked={indicators.vwap}
                onChange={(e) => setIndicators((i) => ({ ...i, vwap: e.target.checked }))}
                className="accent-[#00E599]"
              />
              <span>VWAP</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer hover:text-white ml-2">
              <input
                type="checkbox"
                checked={indicators.bollinger}
                onChange={(e) => setIndicators((i) => ({ ...i, bollinger: e.target.checked }))}
                className="accent-[#38bdf8]"
              />
              <span>B-Bands</span>
            </label>
          </div>

          <button
            onClick={handleClearDrawings}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 text-xs font-bold transition-all"
            title="Clear all drawings"
          >
            🗑 Clear Tools
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Left Drawing Tools, Center Canvas, Right Replay Practice Ticket) */}
      <div className="grid grid-cols-1 lg:grid-cols-[64px_1fr_300px] gap-3 items-start">
        {/* Left Drawing Tools Palette */}
        <div className="flex lg:flex-col items-center gap-1.5 bg-slate-950 border border-white/10 p-2 rounded-2xl overflow-x-auto">
          <ToolButton
            active={activeTool === "CURSOR"}
            onClick={() => setActiveTool("CURSOR")}
            icon="👆"
            title="Pan / Cursor"
          />
          <ToolButton
            active={activeTool === "PITCHFORK"}
            onClick={() => setActiveTool("PITCHFORK")}
            icon="🔱"
            title="Andrews Pitchfork (3 Points)"
          />
          <ToolButton
            active={activeTool === "FIBONACCI"}
            onClick={() => setActiveTool("FIBONACCI")}
            icon="📐"
            title="Fibonacci Retracement"
          />
          <ToolButton
            active={activeTool === "SR_ZONE"}
            onClick={() => setActiveTool("SR_ZONE")}
            icon="🟥"
            title="Support / Resistance Zone Box"
          />
          <ToolButton
            active={activeTool === "TRENDLINE"}
            onClick={() => setActiveTool("TRENDLINE")}
            icon="📈"
            title="Trendline (2 Points)"
          />
          <ToolButton
            active={activeTool === "RAY"}
            onClick={() => setActiveTool("RAY")}
            icon="⚡"
            title="Ray Line"
          />
          <ToolButton
            active={activeTool === "HORIZONTAL_LINE"}
            onClick={() => setActiveTool("HORIZONTAL_LINE")}
            icon="➖"
            title="Horizontal Price Level"
          />
          <ToolButton
            active={activeTool === "POSITION_TOOL"}
            onClick={() => setActiveTool("POSITION_TOOL")}
            icon="🎯"
            title="Long / Short Risk-Reward Box"
          />
          <ToolButton
            active={activeTool === "TEXT"}
            onClick={() => setActiveTool("TEXT")}
            icon="📝"
            title="Text Note Callout"
          />
        </div>

        {/* Center Interactive Canvas Engine */}
        <div className="relative min-h-[550px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-slate-300 font-bold text-sm">
              <span className="animate-spin mr-2">⚙️</span> Loading candle historical feed...
            </div>
          ) : (
            <ChartCanvas
              candles={candles}
              visibleCount={replayIndex}
              activeTool={activeTool}
              drawings={drawings}
              onAddDrawing={handleAddDrawing}
              onUpdateDrawing={handleUpdateDrawing}
              indicators={indicators}
              activeTrade={activeTrade}
            />
          )}
        </div>

        {/* Right Replay Practice Trade Terminal */}
        <div className="bg-slate-950 border border-white/10 p-4 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>🎯</span> Practice Replay Ticket
            </h3>
            <span className="text-[10px] bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 px-2 py-0.5 rounded-full font-bold">
              Simulated Trading
            </span>
          </div>

          {/* Trade Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Quantity / Lot Size:</label>
              <input
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#00E599]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Stop Loss (₹):</label>
                <input
                  type="number"
                  placeholder="Optional SL"
                  value={tradeSL}
                  onChange={(e) => setTradeSL(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Target TP (₹):</label>
                <input
                  type="number"
                  placeholder="Optional TP"
                  value={tradeTP}
                  onChange={(e) => setTradeTP(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Buy / Sell Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handlePlaceOrder("BUY")}
                disabled={Boolean(activeTrade)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md text-xs uppercase"
              >
                BUY LONG ↗
              </button>
              <button
                onClick={() => handlePlaceOrder("SELL")}
                disabled={Boolean(activeTrade)}
                className="w-full bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md text-xs uppercase"
              >
                SELL SHORT ↘
              </button>
            </div>
          </div>

          {/* Active Trade Box */}
          {activeTrade && (
            <div className="bg-slate-900 border border-[#00E599]/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className={activeTrade.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                  {activeTrade.side} {selectedSymbol} @ ₹{activeTrade.entryPrice}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  LIVE OPEN
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>Unrealized P&L:</span>
                <span
                  className={`font-black text-sm ${
                    currentUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {currentUnrealizedPnl >= 0 ? "+" : ""}₹{currentUnrealizedPnl.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCloseActiveTrade}
                className="w-full bg-white/10 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-extrabold py-1.5 rounded-lg text-xs transition-all mt-1"
              >
                Close Trade Position Now
              </button>
            </div>
          )}

          {/* Practice Trade History Log */}
          <div>
            <h4 className="font-bold text-slate-300 mb-2 border-b border-white/10 pb-1">
              📜 Session Trade History ({tradeHistory.length})
            </h4>
            {tradeHistory.length === 0 ? (
              <p className="text-slate-500 text-[11px] italic">No trades placed in this replay session yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {tradeHistory.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-white/5"
                  >
                    <span className="font-bold text-slate-300">
                      {t.side} @ ₹{t.entryPrice}
                    </span>
                    <span
                      className={`font-black ${
                        (t.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {(t.pnl || 0) >= 0 ? "+" : ""}₹{(t.pnl || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar Replay Controller */}
      {isReplayActive && (
        <div className="bg-slate-950 border border-[#00E599]/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xl animate-fadeIn">
          {/* Status & Bar Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-[#00E599] flex items-center gap-1.5 bg-[#00E599]/10 px-3 py-1 rounded-full border border-[#00E599]/30">
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-ping" />
              BAR REPLAY ACTIVE
            </span>
            <span className="text-xs text-slate-300 font-bold">
              Bar {replayIndex} of {candles.length}
            </span>
            <input
              type="range"
              min={20}
              max={candles.length}
              value={replayIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              className="w-36 accent-[#00E599] cursor-pointer"
            />
          </div>

          {/* Replay Controls (Play, Step, Speed) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-1.5 rounded-xl bg-[#00E599] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md"
            >
              {isPlaying ? "⏸ PAUSE" : "▶ PLAY REPLAY"}
            </button>
            <button
              onClick={stepForward}
              disabled={isPlaying}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 font-bold text-xs border border-white/10 transition-all disabled:opacity-50"
            >
              ⏭ Step 1 Bar
            </button>

            {/* Speed Selector */}
            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className="bg-slate-900 border border-white/15 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#00E599]"
            >
              <option value={2000}>0.5x Speed</option>
              <option value={1000}>1.0x Speed</option>
              <option value={500}>2.0x Speed</option>
              <option value={200}>5.0x Speed</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all shrink-0 ${
        active
          ? "bg-[#00E599] text-slate-950 shadow-[0_0_15px_rgba(0,229,153,0.4)] font-bold scale-105"
          : "bg-white/5 hover:bg-white/15 text-slate-300 border border-white/5"
      }`}
    >
      {icon}
    </button>
  );
}
