"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChartCanvas, { DrawingType, DrawingItem } from "./ChartCanvas";
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

  // TradingView Style Replay Mode State
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [isSelectingReplayCutoff, setIsSelectingReplayCutoff] = useState(false);
  const [replayIndex, setReplayIndex] = useState(200); // visible candles count
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per step

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
      return prev + 1;
    });
  }, [candles.length]);

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

  // Handle click on chart to set replay cutoff bar (TradingView style)
  const handleSelectReplayIndex = (idx: number) => {
    setReplayIndex(idx);
    setIsSelectingReplayCutoff(false);
    setIsPlaying(false);
  };

  // Drawings Handlers
  const handleAddDrawing = (item: DrawingItem) => {
    setDrawings((prev) => [...prev, item]);
    setActiveTool("CURSOR");
  };

  const handleUpdateDrawing = (item: DrawingItem) => {
    setDrawings((prev) => prev.map((d) => (d.id === item.id ? item : d)));
  };

  const handleClearDrawings = () => {
    if (confirm("Clear all technical drawings from current chart?")) {
      setDrawings([]);
    }
  };

  const currentCandle = candles[replayIndex - 1] || candles[candles.length - 1];

  return (
    <div className="space-y-3 min-h-[calc(100vh-120px)] flex flex-col">
      {/* Top Main TradingView Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-white/10 p-3 rounded-2xl shrink-0 shadow-lg">
        {/* Left: Symbol Selector, Timeframe Pills, Price Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-sm text-[#00E599] flex items-center gap-1.5 mr-1">
            <span>📊</span> Technical Studio
          </span>

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
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="text-slate-400">{selectedSymbol}:</span>
              <span className="text-emerald-400">₹{currentCandle.close.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Center/Right: Indicators, TradingView Replay Toggle & Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Indicators Checkboxes */}
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
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

          {/* TRADINGVIEW BAR REPLAY TOGGLE BUTTON */}
          <button
            onClick={() => {
              if (isReplayActive) {
                setIsReplayActive(false);
                setIsSelectingReplayCutoff(false);
                setIsPlaying(false);
                setReplayIndex(candles.length);
              } else {
                setIsReplayActive(true);
                setIsSelectingReplayCutoff(true); // Auto-enable click cutoff selection
              }
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md ${
              isReplayActive
                ? "bg-[#00E599] text-slate-950 border border-[#00E599] shadow-[0_0_15px_rgba(0,229,153,0.4)]"
                : "bg-white/10 text-slate-200 hover:bg-[#00E599]/20 hover:text-[#00E599] border border-white/15"
            }`}
          >
            <span>🔄</span>
            <span>Bar Replay</span>
            {isReplayActive && <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />}
          </button>

          <button
            onClick={handleClearDrawings}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 text-xs font-bold transition-all"
            title="Clear all drawings"
          >
            🗑 Clear Tools
          </button>
        </div>
      </div>

      {/* Floating TradingView-Style Bar Replay Dock Controls */}
      {isReplayActive && (
        <div className="bg-slate-900/95 border border-[#00E599]/40 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-xl animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#00E599] bg-[#00E599]/15 border border-[#00E599]/30 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span>▶</span> REPLAY ACTIVE
            </span>

            {/* Jump Cutoff Bar Tool (TradingView Scissors) */}
            <button
              onClick={() => setIsSelectingReplayCutoff(!isSelectingReplayCutoff)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                isSelectingReplayCutoff
                  ? "bg-rose-500 text-white border-rose-400 animate-pulse shadow-md"
                  : "bg-white/10 text-slate-200 border-white/15 hover:bg-white/20"
              }`}
              title="Click on chart to jump replay starting point"
            >
              <span>✂️</span>
              <span>{isSelectingReplayCutoff ? "Click Chart Bar to Jump" : "Jump To Bar"}</span>
            </button>

            <span className="text-xs text-slate-300 font-bold hidden sm:inline">
              Bar {replayIndex} / {candles.length}
            </span>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                setIsSelectingReplayCutoff(false);
              }}
              className="px-4 py-1 rounded-xl bg-[#00E599] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md"
            >
              {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
            </button>

            <button
              onClick={stepForward}
              disabled={isPlaying}
              className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 font-bold text-xs border border-white/10 transition-all disabled:opacity-50"
              title="Forward 1 Bar"
            >
              ⏭ Step Forward
            </button>

            {/* Speed Selector */}
            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className="bg-slate-950 border border-white/15 text-white text-xs font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#00E599]"
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1.0x</option>
              <option value={500}>2.0x</option>
              <option value={200}>5.0x</option>
            </select>

            {/* Replay Scrubber Slider */}
            <input
              type="range"
              min={20}
              max={candles.length}
              value={replayIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              className="w-28 sm:w-36 accent-[#00E599] cursor-pointer"
            />
          </div>

          {/* Exit Replay Button */}
          <button
            onClick={() => {
              setIsReplayActive(false);
              setIsSelectingReplayCutoff(false);
              setIsPlaying(false);
              setReplayIndex(candles.length);
            }}
            className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition-all"
          >
            ✕ Exit Replay
          </button>
        </div>
      )}

      {/* Main Full-Width TradingView Workspace (Left Tool Palette + Center Canvas) */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 min-h-[600px] border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#090d16]">
        {/* Left Vertical Drawing Tools Bar (TradingView Style) */}
        <div className="flex md:flex-col items-center gap-1.5 bg-slate-950 border-r border-white/10 p-2 overflow-x-auto shrink-0">
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

        {/* Center Interactive Full-Width Chart Canvas */}
        <div className="flex-1 relative min-h-[580px] bg-[#090d16]">
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
              isSelectingReplayCutoff={isSelectingReplayCutoff}
              onSelectReplayIndex={handleSelectReplayIndex}
            />
          )}
        </div>
      </div>
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
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all shrink-0 ${
        active
          ? "bg-[#00E599] text-slate-950 shadow-[0_0_15px_rgba(0,229,153,0.4)] font-bold scale-105"
          : "bg-white/5 hover:bg-white/15 text-slate-300 border border-white/5"
      }`}
    >
      {icon}
    </button>
  );
}
