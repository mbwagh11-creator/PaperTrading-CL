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

  const grossPnls = closedTrades.map((t) => t.pnl ?? 0);
  const netPnls = closedTrades.map((t) => (t.pnl ?? 0) - CHARGES_PER_ORDER * 2);

  const wins = netPnls.filter((p) => p > 0);
  const losses = netPnls.filter((p) => p < 0);
  const breakeven = netPnls.filter((p) => p === 0);

  const grossPnl = Number(grossPnls.reduce((a, b) => a + b, 0).toFixed(2));
  const netPnl = Number((grossPnl - totalCharges).toFixed(2));

  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  const decisiveTrades = wins.length + losses.length;
  const winRate = decisiveTrades > 0 ? Number(((wins.length / decisiveTrades) * 100).toFixed(1)) : 0;

  let profitFactor: number | null = null;
  if (grossLoss > 0) {
    profitFactor = Number((grossProfit / grossLoss).toFixed(2));
  } else if (grossProfit > 0) {
    profitFactor = 99.9;
  } else if (closedTrades.length > 0) {
    profitFactor = 1.0;
  }

  return {
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate,
    grossPnl,
    totalCharges,
    netPnl,
    totalPnl: netPnl,
    avgWin: wins.length ? Number((grossProfit / wins.length).toFixed(2)) : 0,
    avgLoss: losses.length ? Number((grossLoss / losses.length).toFixed(2)) : 0,
    profitFactor,
    bestTrade: netPnls.length ? Math.max(...netPnls) : 0,
    worstTrade: netPnls.length ? Math.min(...netPnls) : 0,
  };
}
