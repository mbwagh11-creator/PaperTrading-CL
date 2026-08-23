"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ChartCanvas, { DrawingType, DrawingItem } from "./ChartCanvas";
import { Candle } from "../api/market/history/route";

const POPULAR_SYMBOLS = [
  { symbol: "BANKNIFTY", name: "Nifty Bank Index" },
  { symbol: "NIFTY", name: "NIFTY 50 Index" },
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "INFY", name: "Infosys Ltd" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BTC-USD", name: "Bitcoin / USD" },
  { symbol: "TSLA", name: "Tesla Inc" },
];

const TIMEFRAMES = [
  { label: "1m", interval: "1m", range: "1d" },
  { label: "3m", interval: "1m", range: "1d" },
  { label: "5m", interval: "5m", range: "5d" },
  { label: "15m", interval: "15m", range: "5d" },
  { label: "4h", interval: "1h", range: "1mo" },
  { label: "D", interval: "1d", range: "3mo" },
];

export default function ChartingClient() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedSymbol, setSelectedSymbol] = useState("BANKNIFTY");
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[2]); // 5m default
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tool & Drawings
  const [activeTool, setActiveTool] = useState<DrawingType>("CURSOR");
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [hideDrawings, setHideDrawings] = useState(false);
  const [lockDrawings, setLockDrawings] = useState(false);

  // Indicators toggle
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema9: false,
    vwap: true,
    bollinger: false,
  });
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);

  // TradingView Style Replay Mode State
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [isSelectingReplayCutoff, setIsSelectingReplayCutoff] = useState(false);
  const [replayIndex, setReplayIndex] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1000);

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
    if (lockDrawings) return;
    setDrawings((prev) => [...prev, item]);
    setActiveTool("CURSOR");
  };

  const handleUpdateDrawing = (item: DrawingItem) => {
    setDrawings((prev) => prev.map((d) => (d.id === item.id ? item : d)));
  };

  const handleClearDrawings = () => {
    if (confirm("Clear all drawings from chart?")) {
      setDrawings([]);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`w-full min-h-[calc(100vh-100px)] flex flex-col font-sans select-none ${isDark ? "bg-[#131722] text-[#d1d4dc]" : "bg-[#ffffff] text-[#131722]"}`}>
      {/* 1. OFFICIAL TRADINGVIEW TOP TOOLBAR */}
      <div className={`flex items-center justify-between border-b px-2 py-1.5 overflow-x-auto text-xs shrink-0 ${isDark ? "border-[#2a2e39] bg-[#131722]" : "border-[#e0e3eb] bg-[#ffffff]"}`}>
        {/* Left Section: Symbol, Timeframes, Indicators, Replay */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Symbol Selector Pill */}
          <div className="relative flex items-center">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className={`font-bold px-2.5 py-1 rounded-md cursor-pointer border focus:outline-none appearance-none pr-6 ${
                isDark ? "bg-[#1e222d] border-[#2a2e39] text-[#ffffff]" : "bg-[#f0f3fa] border-[#e0e3eb] text-[#131722]"
              }`}
            >
              {POPULAR_SYMBOLS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </select>
            <span className="absolute right-2 text-[9px] pointer-events-none opacity-60">▼</span>
          </div>

          <button className={`p-1.5 rounded hover:bg-white/10 ${isDark ? "text-[#b2b5be]" : "text-[#434651]"}`} title="Compare Symbol">
            ➕
          </button>

          <div className={`h-4 w-[1px] mx-1 ${isDark ? "bg-[#2a2e39]" : "bg-[#e0e3eb]"}`} />

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setSelectedTf(tf)}
                className={`px-2 py-1 font-semibold rounded text-xs transition-all ${
                  selectedTf.label === tf.label
                    ? isDark
                      ? "bg-[#2a2e39] text-[#2962ff] font-bold"
                      : "bg-[#e0e3eb] text-[#2962ff] font-bold"
                    : isDark
                    ? "text-[#b2b5be] hover:bg-[#1e222d] hover:text-[#ffffff]"
                    : "text-[#434651] hover:bg-[#f0f3fa] hover:text-[#131722]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className={`h-4 w-[1px] mx-1 ${isDark ? "bg-[#2a2e39]" : "bg-[#e0e3eb]"}`} />

          {/* Chart Style (Candles) */}
          <button className={`p-1.5 rounded font-bold hover:bg-white/10 ${isDark ? "text-[#b2b5be]" : "text-[#434651]"}`} title="Candles">
            🕯️
          </button>

          {/* Indicators Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className={`px-2.5 py-1 font-semibold rounded flex items-center gap-1.5 ${
                isDark ? "hover:bg-[#1e222d] text-[#b2b5be]" : "hover:bg-[#f0f3fa] text-[#434651]"
              }`}
            >
              <span className="text-[#2962ff] font-bold">fx</span>
              <span>Indicators</span>
            </button>

            {showIndicatorsMenu && (
              <div className={`absolute left-0 top-full mt-1 z-50 w-48 border rounded-lg shadow-2xl p-2 text-xs space-y-1.5 ${isDark ? "bg-[#1e222d] border-[#2a2e39] text-[#ffffff]" : "bg-[#ffffff] border-[#e0e3eb] text-[#131722]"}`}>
                <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1">Overlays</div>
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-white/10 cursor-pointer">
                  <span>SMA 20</span>
                  <input
                    type="checkbox"
                    checked={indicators.sma20}
                    onChange={(e) => setIndicators((i) => ({ ...i, sma20: e.target.checked }))}
                    className="accent-[#2962ff]"
                  />
                </label>
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-white/10 cursor-pointer">
                  <span>VWAP</span>
                  <input
                    type="checkbox"
                    checked={indicators.vwap}
                    onChange={(e) => setIndicators((i) => ({ ...i, vwap: e.target.checked }))}
                    className="accent-[#089981]"
                  />
                </label>
                <label className="flex items-center justify-between p-1.5 rounded hover:bg-white/10 cursor-pointer">
                  <span>Bollinger Bands</span>
                  <input
                    type="checkbox"
                    checked={indicators.bollinger}
                    onChange={(e) => setIndicators((i) => ({ ...i, bollinger: e.target.checked }))}
                    className="accent-[#38bdf8]"
                  />
                </label>
              </div>
            )}
          </div>

          <div className={`h-4 w-[1px] mx-1 ${isDark ? "bg-[#2a2e39]" : "bg-[#e0e3eb]"}`} />

          {/* TRADINGVIEW REPLAY BUTTON (Rewind Icon ⏪) */}
          <button
            onClick={() => {
              if (isReplayActive) {
                setIsReplayActive(false);
                setIsSelectingReplayCutoff(false);
                setIsPlaying(false);
                setReplayIndex(candles.length);
              } else {
                setIsReplayActive(true);
                setIsSelectingReplayCutoff(true); // Jump mode default
              }
            }}
            className={`px-3 py-1 font-bold rounded flex items-center gap-1.5 transition-all ${
              isReplayActive
                ? "bg-[#2962ff] text-white shadow-md"
                : isDark
                ? "text-[#b2b5be] hover:bg-[#1e222d] hover:text-white"
                : "text-[#434651] hover:bg-[#f0f3fa] hover:text-[#131722]"
            }`}
          >
            <span>⏪</span>
            <span>Replay</span>
          </button>
        </div>

        {/* Right Section: Theme Toggle, Settings, Fullscreen, Camera */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`p-1.5 rounded font-bold hover:bg-white/10 ${isDark ? "text-[#b2b5be]" : "text-[#434651]"}`}
            title="Toggle Light/Dark Theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className={`p-1.5 rounded font-bold hover:bg-white/10 ${isDark ? "text-[#b2b5be]" : "text-[#434651]"}`}
            title="Toggle Fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* 2. TRADINGVIEW REPLAY FLOATING CONTROL BAR */}
      {isReplayActive && (
        <div className={`flex items-center justify-between border-b px-4 py-2 text-xs animate-fadeIn shrink-0 shadow-md ${isDark ? "bg-[#1e222d] border-[#2a2e39] text-[#ffffff]" : "bg-[#f0f3fa] border-[#e0e3eb] text-[#131722]"}`}>
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-[#2962ff] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2962ff] animate-ping" />
              BAR REPLAY
            </span>

            {/* Jump Cutoff Bar Tool (TradingView Scissors) */}
            <button
              onClick={() => setIsSelectingReplayCutoff(!isSelectingReplayCutoff)}
              className={`px-3 py-1 rounded font-bold flex items-center gap-1.5 transition-all border ${
                isSelectingReplayCutoff
                  ? "bg-[#f23645] text-white border-[#f23645] animate-pulse"
                  : isDark
                  ? "bg-[#2a2e39] border-[#363a45] text-white hover:bg-[#363a45]"
                  : "bg-white border-[#e0e3eb] text-slate-800 hover:bg-slate-100"
              }`}
            >
              <span>✂️</span>
              <span>{isSelectingReplayCutoff ? "Click Chart Bar to Jump" : "Jump to..."}</span>
            </button>

            <span className="opacity-75 font-semibold">
              Bar {replayIndex} / {candles.length}
            </span>
          </div>

          {/* Center Replay Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                setIsSelectingReplayCutoff(false);
              }}
              className="px-4 py-1 rounded bg-[#2962ff] text-white font-bold hover:brightness-110 shadow"
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
              onClick={stepForward}
              disabled={isPlaying}
              className={`px-3 py-1 rounded font-bold border ${isDark ? "bg-[#2a2e39] border-[#363a45] text-white" : "bg-white border-[#e0e3eb] text-slate-800"} disabled:opacity-40`}
            >
              ⏭ Step
            </button>

            <select
              value={replaySpeed}
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              className={`px-2 py-1 rounded font-bold border focus:outline-none ${isDark ? "bg-[#131722] border-[#2a2e39] text-white" : "bg-white border-[#e0e3eb] text-slate-800"}`}
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={200}>5x</option>
            </select>
          </div>

          {/* Close Replay */}
          <button
            onClick={() => {
              setIsReplayActive(false);
              setIsSelectingReplayCutoff(false);
              setIsPlaying(false);
              setReplayIndex(candles.length);
            }}
            className="px-3 py-1 font-bold text-rose-500 hover:bg-rose-500/10 rounded"
          >
            ✕ Exit Replay
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE (LEFT ICON BAR + CENTER CANVAS) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical TradingView Icon Bar */}
        <div className={`flex flex-col items-center gap-1 border-r py-2 px-1 shrink-0 ${isDark ? "border-[#2a2e39] bg-[#131722]" : "border-[#e0e3eb] bg-[#ffffff]"}`}>
          <TvIconButton
            active={activeTool === "CURSOR"}
            onClick={() => setActiveTool("CURSOR")}
            icon="┼"
            title="Crosshair (+)"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "TRENDLINE"}
            onClick={() => setActiveTool("TRENDLINE")}
            icon="╱"
            title="Trendline Tools"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "PITCHFORK"}
            onClick={() => setActiveTool("PITCHFORK")}
            icon="🔱"
            title="Andrews Pitchfork"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "FIBONACCI"}
            onClick={() => setActiveTool("FIBONACCI")}
            icon="📐"
            title="Fibonacci Retracement"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "SR_ZONE"}
            onClick={() => setActiveTool("SR_ZONE")}
            icon="▱"
            title="Support / Resistance Zone Box"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "TEXT"}
            onClick={() => setActiveTool("TEXT")}
            icon="T"
            title="Text Callout Annotation"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "POSITION_TOOL"}
            onClick={() => setActiveTool("POSITION_TOOL")}
            icon="📊"
            title="Long / Short Risk-Reward Tool"
            isDark={isDark}
          />
          <TvIconButton
            active={activeTool === "HORIZONTAL_LINE"}
            onClick={() => setActiveTool("HORIZONTAL_LINE")}
            icon="━"
            title="Horizontal Line"
            isDark={isDark}
          />

          <div className={`w-5 h-[1px] my-1 ${isDark ? "bg-[#2a2e39]" : "bg-[#e0e3eb]"}`} />

          <TvIconButton
            active={lockDrawings}
            onClick={() => setLockDrawings(!lockDrawings)}
            icon={lockDrawings ? "🔒" : "🔓"}
            title="Lock All Drawings"
            isDark={isDark}
          />
          <TvIconButton
            active={hideDrawings}
            onClick={() => setHideDrawings(!hideDrawings)}
            icon={hideDrawings ? "🙈" : "👁️"}
            title="Hide All Drawings"
            isDark={isDark}
          />
          <TvIconButton
            active={false}
            onClick={handleClearDrawings}
            icon="🗑️"
            title="Clear All Drawings"
            isDark={isDark}
          />
        </div>

        {/* Center Interactive Full-Height Canvas */}
        <div className="flex-1 relative h-full w-full">
          {loading ? (
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-sm ${isDark ? "bg-[#131722] text-slate-300" : "bg-[#ffffff] text-slate-700"}`}>
              <span className="animate-spin mr-2">⚙️</span> Loading candle historical data...
            </div>
          ) : (
            <ChartCanvas
              candles={candles}
              visibleCount={replayIndex}
              activeTool={activeTool}
              drawings={hideDrawings ? [] : drawings}
              onAddDrawing={handleAddDrawing}
              onUpdateDrawing={handleUpdateDrawing}
              indicators={indicators}
              isSelectingReplayCutoff={isSelectingReplayCutoff}
              onSelectReplayIndex={handleSelectReplayIndex}
              theme={theme}
              symbolName={selectedSymbol}
              timeframeLabel={selectedTf.label}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TvIconButton({
  active,
  onClick,
  icon,
  title,
  isDark,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all ${
        active
          ? "bg-[#2962ff] text-white shadow"
          : isDark
          ? "text-[#b2b5be] hover:bg-[#1e222d] hover:text-white"
          : "text-[#434651] hover:bg-[#f0f3fa] hover:text-[#131722]"
      }`}
    >
      {icon}
    </button>
  );
}
