"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Candle } from "../api/market/history/route";

export type DrawingType =
  | "CURSOR"
  | "PITCHFORK"
  | "FIBONACCI"
  | "SR_ZONE"
  | "TRENDLINE"
  | "RAY"
  | "HORIZONTAL_LINE"
  | "POSITION_TOOL"
  | "TEXT";

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingItem {
  id: string;
  type: DrawingType;
  points: DrawingPoint[]; // 1 to 3 points depending on tool
  color?: string;
  label?: string;
  positionType?: "LONG" | "SHORT"; // for position tool
  targetPrice?: number;
  stopPrice?: number;
  zoneType?: "SUPPORT" | "RESISTANCE" | "PIVOT";
}

export interface PracticeTrade {
  id: string;
  side: "BUY" | "SELL";
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  entryTime: number;
  exitPrice?: number;
  status: "OPEN" | "CLOSED_TP" | "CLOSED_SL" | "CLOSED_MANUAL";
  pnl?: number;
  pnlPercent?: number;
}

interface ChartCanvasProps {
  candles: Candle[];
  visibleCount: number; // Replay bar count cutoff
  activeTool: DrawingType;
  drawings: DrawingItem[];
  onAddDrawing: (drawing: DrawingItem) => void;
  onUpdateDrawing: (drawing: DrawingItem) => void;
  onSelectDrawing?: (id: string | null) => void;
  indicators: {
    sma20: boolean;
    sma50: boolean;
    ema9: boolean;
    vwap: boolean;
    bollinger: boolean;
  };
  activeTrade?: PracticeTrade | null;
  onPlaceReplayOrder?: (side: "BUY" | "SELL", entry: number, sl: number, tp: number) => void;
}

export default function ChartCanvas({
  candles,
  visibleCount,
  activeTool,
  drawings,
  onAddDrawing,
  onUpdateDrawing,
  indicators,
  activeTrade,
}: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport zoom & scroll state
  const [startIndex, setStartIndex] = useState<number>(0);
  const [barsToShow, setBarsToShow] = useState<number>(80);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartIndex, setPanStartIndex] = useState(0);

  // Mouse crosshair & drawing in-progress state
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [draftPoints, setDraftPoints] = useState<DrawingPoint[]>([]);
  const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);

  // Limit effective candles to current replay cutoff count
  const effectiveCandles = candles.slice(0, visibleCount);

  // Auto-scroll to latest candle when visible count increases during replay
  useEffect(() => {
    if (effectiveCandles.length > 0) {
      const maxStart = Math.max(0, effectiveCandles.length - barsToShow);
      setStartIndex(maxStart);
    }
  }, [visibleCount, effectiveCandles.length, barsToShow]);

  // Coordinate mapping helper routines
  const getVisibleRange = useCallback(() => {
    const visible = effectiveCandles.slice(
      startIndex,
      Math.min(effectiveCandles.length, startIndex + barsToShow)
    );
    if (visible.length === 0) {
      return { minPrice: 0, maxPrice: 100, minVolume: 0, maxVolume: 100, visible };
    }
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = -Infinity;

    visible.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Add padding to price scale (5%)
    const padding = (maxPrice - minPrice) * 0.05 || 10;
    return {
      minPrice: minPrice - padding,
      maxPrice: maxPrice + padding,
      minVolume: maxVolume,
      visible,
    };
  }, [effectiveCandles, startIndex, barsToShow]);

  // Convert Time & Price to Canvas X, Y coordinates
  const priceToY = (price: number, minPrice: number, maxPrice: number, height: number) => {
    const chartHeight = height - 50; // Leave 50px for bottom time scale & volume area
    const ratio = (price - minPrice) / (maxPrice - minPrice || 1);
    return chartHeight - ratio * (chartHeight - 30); // 30px top padding
  };

  const yToPrice = (y: number, minPrice: number, maxPrice: number, height: number) => {
    const chartHeight = height - 50;
    const ratio = (chartHeight - y) / (chartHeight - 30);
    return minPrice + ratio * (maxPrice - minPrice);
  };

  const indexToX = (index: number, width: number) => {
    const chartWidth = width - 70; // Leave 70px for right price scale
    const barWidth = chartWidth / barsToShow;
    const relativeIdx = index - startIndex;
    return relativeIdx * barWidth + barWidth / 2;
  };

  const xToIndex = (x: number, width: number) => {
    const chartWidth = width - 70;
    const barWidth = chartWidth / barsToShow;
    const rel = Math.floor(x / barWidth);
    return startIndex + rel;
  };

  const timeToX = (time: number, width: number) => {
    const idx = effectiveCandles.findIndex((c) => c.time >= time);
    if (idx === -1) return -100;
    return indexToX(idx, width);
  };

  const xToPoint = (x: number, y: number, width: number, height: number): DrawingPoint | null => {
    const idx = xToIndex(x, width);
    const candle = effectiveCandles[Math.min(Math.max(0, idx), effectiveCandles.length - 1)];
    if (!candle) return null;
    const { minPrice, maxPrice } = getVisibleRange();
    const price = yToPrice(y, minPrice, maxPrice, height);
    return { time: candle.time, price: Number(price.toFixed(2)) };
  };

  // Main Render Loop
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    const { minPrice, maxPrice, maxVolume, visible } = getVisibleRange();
    const chartWidth = width - 70;
    const chartHeight = height - 50;
    const barWidth = chartWidth / barsToShow;
    const candleSpacing = Math.max(1, barWidth * 0.15);
    const candleBodyWidth = Math.max(1, barWidth - candleSpacing * 2);

    // 1. Draw Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;

    // Horizontal Price Grid & Scale
    const priceRange = maxPrice - minPrice;
    const priceStep = priceRange / 8;
    ctx.textAlign = "left";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";

    for (let i = 0; i <= 8; i++) {
      const p = minPrice + i * priceStep;
      const y = priceToY(p, minPrice, maxPrice, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Right price scale label
      ctx.fillText(p.toFixed(2), chartWidth + 8, y + 4);
    }

    // Vertical Time Grid & Scale
    const visibleStep = Math.max(1, Math.floor(visible.length / 6));
    for (let i = 0; i < visible.length; i += visibleStep) {
      const idx = startIndex + i;
      const x = indexToX(idx, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      // Bottom time label
      const d = new Date(visible[i].time * 1000);
      const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")} ${d.getDate()}/${d.getMonth() + 1}`;
      ctx.fillText(timeStr, x - 25, chartHeight + 20);
    }

    // 2. Draw Volume Bars at bottom 20% of chart
    const volHeight = chartHeight * 0.2;
    visible.forEach((c, i) => {
      const idx = startIndex + i;
      const x = indexToX(idx, width);
      const vRatio = c.volume / (maxVolume || 1);
      const vY = chartHeight - vRatio * volHeight;

      ctx.fillStyle = c.close >= c.open ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.25)";
      ctx.fillRect(x - candleBodyWidth / 2, vY, candleBodyWidth, chartHeight - vY);
    });

    // 3. Render Technical Indicators (SMA, EMA, VWAP, Bollinger Bands)
    if (effectiveCandles.length > 0) {
      // Helper for SMA
      const calcSMA = (period: number) => {
        const result: (number | null)[] = [];
        for (let i = 0; i < effectiveCandles.length; i++) {
          if (i < period - 1) {
            result.push(null);
          } else {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) sum += effectiveCandles[j].close;
            result.push(sum / period);
          }
        }
        return result;
      };

      // Helper for EMA
      const calcEMA = (period: number) => {
        const result: (number | null)[] = [];
        const k = 2 / (period + 1);
        let prevEma: number | null = null;
        for (let i = 0; i < effectiveCandles.length; i++) {
          if (i < period - 1) {
            result.push(null);
          } else if (i === period - 1) {
            let sum = 0;
            for (let j = 0; j < period; j++) sum += effectiveCandles[j].close;
            prevEma = sum / period;
            result.push(prevEma);
          } else {
            prevEma = effectiveCandles[i].close * k + (prevEma as number) * (1 - k);
            result.push(prevEma);
          }
        }
        return result;
      };

      const drawLineIndicator = (data: (number | null)[], color: string, widthPx = 1.5) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = widthPx;
        let started = false;

        for (let i = 0; i < visible.length; i++) {
          const idx = startIndex + i;
          const val = data[idx];
          if (val !== null && val !== undefined) {
            const x = indexToX(idx, width);
            const y = priceToY(val, minPrice, maxPrice, height);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };

      if (indicators.sma20) drawLineIndicator(calcSMA(20), "#3b82f6"); // Blue
      if (indicators.sma50) drawLineIndicator(calcSMA(50), "#eab308"); // Yellow
      if (indicators.ema9) drawLineIndicator(calcEMA(9), "#a855f7"); // Purple

      // VWAP calculation
      if (indicators.vwap) {
        const vwapData: (number | null)[] = [];
        let cumVolPrice = 0;
        let cumVol = 0;
        effectiveCandles.forEach((c) => {
          const typical = (c.high + c.low + c.close) / 3;
          cumVolPrice += typical * c.volume;
          cumVol += c.volume;
          vwapData.push(cumVol > 0 ? cumVolPrice / cumVol : null);
        });
        drawLineIndicator(vwapData, "#00E599", 2); // Accent Cyan/Green
      }

      // Bollinger Bands
      if (indicators.bollinger) {
        const period = 20;
        const sma = calcSMA(period);
        const upperBand: (number | null)[] = [];
        const lowerBand: (number | null)[] = [];

        for (let i = 0; i < effectiveCandles.length; i++) {
          const mean = sma[i];
          if (mean === null) {
            upperBand.push(null);
            lowerBand.push(null);
          } else {
            let varianceSum = 0;
            for (let j = i - period + 1; j <= i; j++) {
              varianceSum += Math.pow(effectiveCandles[j].close - mean, 2);
            }
            const stdDev = Math.sqrt(varianceSum / period);
            upperBand.push(mean + 2 * stdDev);
            lowerBand.push(mean - 2 * stdDev);
          }
        }
        drawLineIndicator(upperBand, "rgba(56, 189, 248, 0.7)");
        drawLineIndicator(lowerBand, "rgba(56, 189, 248, 0.7)");
      }
    }

    // 4. Draw Candlesticks
    visible.forEach((c, i) => {
      const idx = startIndex + i;
      const x = indexToX(idx, width);
      const openY = priceToY(c.open, minPrice, maxPrice, height);
      const closeY = priceToY(c.close, minPrice, maxPrice, height);
      const highY = priceToY(c.high, minPrice, maxPrice, height);
      const lowY = priceToY(c.low, minPrice, maxPrice, height);

      const isBull = c.close >= c.open;
      const color = isBull ? "#10b981" : "#f43f5e";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Candle Body
      ctx.fillStyle = color;
      const topY = Math.min(openY, closeY);
      const bodyH = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillRect(x - candleBodyWidth / 2, topY, candleBodyWidth, bodyH);
    });

    // 5. Render Technical Drawing Tools (Pitchfork, Fibonacci, SR Zone, Position Box, etc.)
    const drawSingleTool = (item: DrawingItem, isDraft = false) => {
      const pts = item.points;
      if (!pts || pts.length === 0) return;

      // 5A. ANDREWS' PITCHFORK (3 points required)
      if (item.type === "PITCHFORK" && (pts.length === 3 || (isDraft && pts.length >= 2))) {
        const p1 = pts[0];
        const p2 = pts[1];
        const p3 = pts[2] || (mousePos ? xToPoint(mousePos.x, mousePos.y, width, height) : p2);
        if (!p1 || !p2 || !p3) return;

        const x1 = timeToX(p1.time, width);
        const y1 = priceToY(p1.price, minPrice, maxPrice, height);
        const x2 = timeToX(p2.time, width);
        const y2 = priceToY(p2.price, minPrice, maxPrice, height);
        const x3 = timeToX(p3.time, width);
        const y3 = priceToY(p3.price, minPrice, maxPrice, height);

        // Midpoint M between P2 and P3
        const mx = (x2 + x3) / 2;
        const my = (y2 + y3) / 2;

        // Angle / Slope of Median Line from P1 through M
        const dx = mx - x1;
        const dy = my - y1;
        const lengthExt = Math.max(width, height) * 2;
        const norm = Math.hypot(dx, dy) || 1;
        const uX = (dx / norm) * lengthExt;
        const uY = (dy / norm) * lengthExt;

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = item.color || "#00E599";

        // Median Line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + uX, y1 + uY);
        ctx.stroke();

        // Upper Channel Line from P2 parallel to Median
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + uX, y2 + uY);
        ctx.stroke();

        // Lower Channel Line from P3 parallel to Median
        ctx.beginPath();
        ctx.moveTo(x3, y3);
        ctx.lineTo(x3 + uX, y3 + uY);
        ctx.stroke();

        // Connect P2 to P3 baseline handle
        ctx.strokeStyle = "rgba(0, 229, 153, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();
        ctx.setLineDash([]);

        // Handle points circles
        [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x: x3, y: y3 },
        ].forEach((pt, idx) => {
          ctx.fillStyle = "#00E599";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#090d16";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(`P${idx + 1}`, pt.x - 4, pt.y + 3);
        });
      }

      // 5B. FIBONACCI RETRACEMENT (2 points)
      if (item.type === "FIBONACCI" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[1];
        const x1 = timeToX(p1.time, width);
        const y1 = priceToY(p1.price, minPrice, maxPrice, height);
        const x2 = timeToX(p2.time, width);
        const y2 = priceToY(p2.price, minPrice, maxPrice, height);

        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2, chartWidth);

        const highP = Math.max(p1.price, p2.price);
        const lowP = Math.min(p1.price, p2.price);
        const rangeP = highP - lowP;

        const fibLevels = [
          { level: 0.0, label: "0.0% (0.000)", color: "#ef4444" },
          { level: 0.236, label: "23.6%", color: "#f97316" },
          { level: 0.382, label: "38.2%", color: "#eab308" },
          { level: 0.5, label: "50.0%", color: "#00E599" },
          { level: 0.618, label: "61.8% (Golden Ratio)", color: "#3b82f6" },
          { level: 0.786, label: "78.6%", color: "#a855f7" },
          { level: 1.0, label: "100.0%", color: "#ef4444" },
          { level: 1.618, label: "161.8% Extension", color: "#ec4899" },
        ];

        fibLevels.forEach((fib) => {
          const valP = highP - rangeP * fib.level;
          const fy = priceToY(valP, minPrice, maxPrice, height);

          ctx.strokeStyle = fib.color;
          ctx.lineWidth = fib.level === 0.618 || fib.level === 0.5 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(minX, fy);
          ctx.lineTo(maxX, fy);
          ctx.stroke();

          ctx.fillStyle = fib.color;
          ctx.font = "10px sans-serif";
          ctx.fillText(`Fib ${fib.label} - ₹${valP.toFixed(2)}`, minX + 5, fy - 3);
        });
      }

      // 5C. SUPPORT & RESISTANCE ZONE (Box tool)
      if (item.type === "SR_ZONE" && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[1];
        const x1 = timeToX(p1.time, width);
        const y1 = priceToY(p1.price, minPrice, maxPrice, height);
        const x2 = timeToX(p2.time, width);
        const y2 = priceToY(p2.price, minPrice, maxPrice, height);

        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1) || chartWidth - rx;
        const rh = Math.abs(y2 - y1);

        const isSupport = (item.zoneType || "SUPPORT") === "SUPPORT";
        const zoneColor = isSupport ? "rgba(16, 185, 129, 0.18)" : "rgba(244, 63, 94, 0.18)";
        const borderColor = isSupport ? "#10b981" : "#f43f5e";

        ctx.fillStyle = zoneColor;
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx, ry, rw, rh);

        const highZone = Math.max(p1.price, p2.price);
        const lowZone = Math.min(p1.price, p2.price);
        ctx.fillStyle = borderColor;
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(
          `${isSupport ? "🟩 Support Zone" : "🟥 Resistance Zone"} [₹${lowZone.toFixed(
            2
          )} - ₹${highZone.toFixed(2)}]`,
          rx + 6,
          ry + 14
        );
      }

      // 5D. TRENDLINE & RAY
      if ((item.type === "TRENDLINE" || item.type === "RAY") && pts.length >= 2) {
        const p1 = pts[0];
        const p2 = pts[1];
        const x1 = timeToX(p1.time, width);
        const y1 = priceToY(p1.price, minPrice, maxPrice, height);
        const x2 = timeToX(p2.time, width);
        const y2 = priceToY(p2.price, minPrice, maxPrice, height);

        ctx.strokeStyle = item.color || "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);

        if (item.type === "RAY") {
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.hypot(dx, dy) || 1;
          ctx.lineTo(x1 + (dx / len) * width * 2, y1 + (dy / len) * height * 2);
        } else {
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // 5E. HORIZONTAL LINE
      if (item.type === "HORIZONTAL_LINE" && pts.length >= 1) {
        const p = pts[0];
        const y = priceToY(p.price, minPrice, maxPrice, height);
        ctx.strokeStyle = item.color || "#eab308";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge Tag
        ctx.fillStyle = "#eab308";
        ctx.fillRect(chartWidth, y - 10, 65, 20);
        ctx.fillStyle = "#090d16";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`₹${p.price.toFixed(2)}`, chartWidth + 5, y + 4);
      }

      // 5F. LONG / SHORT RISK-REWARD POSITION TOOL
      if (item.type === "POSITION_TOOL" && pts.length >= 2) {
        const pEntry = pts[0];
        const pTarget = pts[1];
        const pStop = pts[2] || {
          time: pTarget.time,
          price: pEntry.price - (pTarget.price - pEntry.price) * 0.5,
        };

        const isLong = (item.positionType || "LONG") === "LONG";
        const entryY = priceToY(pEntry.price, minPrice, maxPrice, height);
        const targetY = priceToY(pTarget.price, minPrice, maxPrice, height);
        const stopY = priceToY(pStop.price, minPrice, maxPrice, height);

        const x1 = timeToX(pEntry.time, width);
        const x2 = Math.max(x1 + 100, timeToX(pTarget.time, width));

        const targetDist = Math.abs(pTarget.price - pEntry.price);
        const stopDist = Math.abs(pEntry.price - pStop.price);
        const rrRatio = stopDist > 0 ? (targetDist / stopDist).toFixed(2) : "N/A";

        // Green Profit Box
        ctx.fillStyle = isLong ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)";
        ctx.fillRect(x1, Math.min(entryY, targetY), x2 - x1, Math.abs(targetY - entryY));

        // Red Loss Box
        ctx.fillStyle = isLong ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)";
        ctx.fillRect(x1, Math.min(entryY, stopY), x2 - x1, Math.abs(stopY - entryY));

        // Entry Line
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, entryY);
        ctx.lineTo(x2, entryY);
        ctx.stroke();

        // R:R Badge
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x1 + 8, entryY - 12, 140, 24);
        ctx.strokeStyle = "#38bdf8";
        ctx.strokeRect(x1 + 8, entryY - 12, 140, 24);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`Target R:R = 1 : ${rrRatio}`, x1 + 14, entryY + 3);
      }

      // 5G. TEXT ANNOTATION
      if (item.type === "TEXT" && pts.length >= 1) {
        const p = pts[0];
        const x = timeToX(p.time, width);
        const y = priceToY(p.price, minPrice, maxPrice, height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`📝 ${item.label || "Key Pivot Level"}`, x + 5, y - 5);
      }
    };

    // Render saved drawings
    drawings.forEach((d) => drawSingleTool(d, false));

    // Render active drawing in progress draft
    if (draftPoints.length > 0) {
      const mousePt = mousePos
        ? xToPoint(mousePos.x, mousePos.y, width, height)
        : null;
      const draftPts = mousePt ? [...draftPoints, mousePt] : draftPoints;
      drawSingleTool(
        {
          id: "draft",
          type: activeTool,
          points: draftPts,
          color: "#00E599",
        },
        true
      );
    }

    // 6. Overlay Practice Active Trade Lines (Replay Mode)
    if (activeTrade && activeTrade.status === "OPEN") {
      const entryY = priceToY(activeTrade.entryPrice, minPrice, maxPrice, height);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(chartWidth, entryY - 10, 65, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`ENTRY ₹${activeTrade.entryPrice}`, chartWidth + 4, entryY + 4);

      if (activeTrade.stopLoss) {
        const slY = priceToY(activeTrade.stopLoss, minPrice, maxPrice, height);
        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(chartWidth, slY);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(chartWidth, slY - 10, 65, 20);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`SL ₹${activeTrade.stopLoss}`, chartWidth + 4, slY + 4);
      }

      if (activeTrade.takeProfit) {
        const tpY = priceToY(activeTrade.takeProfit, minPrice, maxPrice, height);
        ctx.strokeStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(chartWidth, tpY);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.fillRect(chartWidth, tpY - 10, 65, 20);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`TP ₹${activeTrade.takeProfit}`, chartWidth + 4, tpY + 4);
      }
      ctx.setLineDash([]);
    }

    // 7. Render Mouse Crosshair & Tooltips
    if (mousePos && mousePos.x <= chartWidth && mousePos.y <= chartHeight) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hover price badge
      const hoverP = yToPrice(mousePos.y, minPrice, maxPrice, height);
      ctx.fillStyle = "#334155";
      ctx.fillRect(chartWidth, mousePos.y - 10, 68, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(`₹${hoverP.toFixed(2)}`, chartWidth + 5, mousePos.y + 4);
    }

    // 8. Replay Cutoff Line
    if (visibleCount < candles.length) {
      const lastVisibleIdx = visibleCount - 1;
      const x = indexToX(lastVisibleIdx, width);

      ctx.strokeStyle = "#00E599";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#00E599";
      ctx.fillRect(x - 45, 10, 90, 22);
      ctx.fillStyle = "#090d16";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("⏸ REPLAY CUTOFF", x - 40, 25);
    }
  }, [
    canvasRef,
    getVisibleRange,
    startIndex,
    barsToShow,
    effectiveCandles,
    indicators,
    drawings,
    draftPoints,
    mousePos,
    activeTool,
    activeTrade,
    visibleCount,
    candles.length,
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderChart();
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderChart]);

  // Re-render when data or mouse state changes
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Mouse Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    setBarsToShow((prev) => Math.min(250, Math.max(20, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "CURSOR") {
      setIsPanning(true);
      setPanStartX(x);
      setPanStartIndex(startIndex);
      return;
    }

    // Add drawing point
    const pt = xToPoint(x, y, canvasRef.current.width, canvasRef.current.height);
    if (!pt) return;

    const newDraft = [...draftPoints, pt];

    // Determine target points needed per tool
    let targetPts = 2;
    if (activeTool === "PITCHFORK") targetPts = 3;
    if (activeTool === "HORIZONTAL_LINE" || activeTool === "TEXT") targetPts = 1;

    if (newDraft.length >= targetPts) {
      // Complete drawing
      let labelText = "";
      if (activeTool === "TEXT") {
        labelText = prompt("Enter chart callout text:", "Key Support Level") || "Note";
      }

      onAddDrawing({
        id: `draw_${Date.now()}`,
        type: activeTool,
        points: newDraft,
        color: "#00E599",
        label: labelText,
      });
      setDraftPoints([]);
    } else {
      setDraftPoints(newDraft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (isPanning) {
      const chartWidth = canvasRef.current.width - 70;
      const barWidth = chartWidth / barsToShow;
      const deltaBars = Math.round((panStartX - x) / barWidth);
      const maxStart = Math.max(0, effectiveCandles.length - barsToShow);
      setStartIndex(Math.min(maxStart, Math.max(0, panStartIndex + deltaBars)));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[550px] select-none bg-[#090d16] overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setMousePos(null);
          setIsPanning(false);
        }}
        className="w-full h-full cursor-crosshair block"
      />
    </div>
  );
}
