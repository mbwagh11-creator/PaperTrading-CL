import type { Trade } from "@prisma/client";

/**
 * Calculates P&L for a trade.
 * BUY (long): profit when price rises above entry.
 * SELL (short/writing): profit when price falls below entry.
 */
export function calculatePnl(
  side: "BUY" | "SELL",
  entryPrice: number,
  referencePrice: number,
  quantity: number
): number {
  const diff =
    side === "BUY" ? referencePrice - entryPrice : entryPrice - referencePrice;
  return Number((diff * quantity).toFixed(2));
}

/** Live/unrealized P&L for an OPEN trade using its currentPrice (falls back to entryPrice). */
export function livePnl(trade: Trade): number {
  const ref = trade.currentPrice ?? trade.entryPrice;
  return calculatePnl(trade.side as "BUY" | "SELL", trade.entryPrice, ref, trade.quantity);
}

export const CHARGES_PER_ORDER = 50.0; // ₹50 flat charge per order execution leg

export interface AnalyticsSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // percentage
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  totalPnl: number; // alias for netPnl
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null;
  bestTrade: number;
  worstTrade: number;
}

/** Get order charges for a trade based on status (1 leg = ₹50 for OPEN, 2 legs = ₹100 for CLOSED). */
export function getTradeCharges(status: string): number {
  return status === "CLOSED" ? CHARGES_PER_ORDER * 2 : CHARGES_PER_ORDER;
}

/** Performance analytics computed strictly from CLOSED trades. */
export function computeAnalytics(closedTrades: Trade[]): AnalyticsSummary {
  const totalCharges = closedTrades.length * (CHARGES_PER_ORDER * 2); // ₹100 per closed trade (2 legs)

  // Compute trade P&Ls
  const tradePnls = closedTrades.map((t) => {
    const ref = t.exitPrice ?? t.currentPrice ?? t.entryPrice;
    const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
    const gross = typeof t.pnl === "number" && t.pnl !== 0 ? t.pnl : Number((diff * t.quantity).toFixed(2));
    const net = gross - CHARGES_PER_ORDER * 2;
    return { gross, net };
  });

  const grossPnls = tradePnls.map((t) => t.gross);
  const netPnls = tradePnls.map((t) => t.net);

  // Categorize trades: Win if gross > 0, Loss if gross < 0, Breakeven if gross === 0
  const winTrades = tradePnls.filter((t) => t.gross > 0);
  const lossTrades = tradePnls.filter((t) => t.gross < 0);
  const breakevenTrades = tradePnls.filter((t) => t.gross === 0);

  const grossPnl = Number(grossPnls.reduce((a, b) => a + b, 0).toFixed(2));
  const netPnl = Number((grossPnl - totalCharges).toFixed(2));

  const totalGrossWin = winTrades.reduce((sum, t) => sum + t.gross, 0);
  const totalGrossLoss = Math.abs(lossTrades.reduce((sum, t) => sum + t.gross, 0));

  const decisiveTrades = winTrades.length + lossTrades.length;
  const winRate = decisiveTrades > 0 ? Number(((winTrades.length / decisiveTrades) * 100).toFixed(1)) : 0;

  let profitFactor: number | null = null;
  if (totalGrossLoss > 0) {
    profitFactor = Number((totalGrossWin / totalGrossLoss).toFixed(2));
  } else if (totalGrossWin > 0) {
    profitFactor = 99.9;
  } else if (closedTrades.length > 0) {
    profitFactor = 1.0;
  }

  const avgWin = winTrades.length ? Number((totalGrossWin / winTrades.length).toFixed(2)) : 0;
  const avgLoss = lossTrades.length ? Number((totalGrossLoss / lossTrades.length).toFixed(2)) : 0;

  return {
    totalTrades: closedTrades.length,
    wins: winTrades.length,
    losses: lossTrades.length,
    breakeven: breakevenTrades.length,
    winRate,
    grossPnl,
    totalCharges,
    netPnl,
    totalPnl: netPnl,
    avgWin,
    avgLoss,
    profitFactor,
    bestTrade: netPnls.length ? Math.max(...netPnls) : 0,
    worstTrade: netPnls.length ? Math.min(...netPnls) : 0,
  };
}
