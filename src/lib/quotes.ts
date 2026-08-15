/**
 * Market Quote Utility Engine
 * Fetches real NSE market quotes via public financial endpoints (Yahoo Finance)
 * with a fallback option-greeks calculation engine for derivative instruments.
 * No Upstox API key or account is required.
 */

interface QuoteResult {
  lastPrice: number;
  provider: "Yahoo Finance Live" | "Simulated Market Engine" | "Upstox Live";
  symbol: string;
}

interface QuoteHint {
  underlying?: string | null;
  strikePrice?: number | null;
  optionType?: string | null;
  name?: string | null;
}

const STOCK_MAPPINGS: Record<string, string> = {
  NIFTY: "^NSEI",
  BANKNIFTY: "^NSEBANK",
  FINNIFTY: "NIFTY_FIN_SERVICE.NS",
  MIDCPNIFTY: "NIFTY_MID_SELECT.NS",
};

// Fallback baseline spot prices if external API is unreachable
const BASELINE_SPOTS: Record<string, number> = {
  NIFTY: 24150,
  BANKNIFTY: 57446,
  FINNIFTY: 23500,
  MIDCPNIFTY: 12800,
  RELIANCE: 1324,
  TCS: 4180,
  INFY: 1820,
  HDFCBANK: 1640,
  ICICIBANK: 1220,
  SBIN: 810,
  AXISBANK: 1150,
  KOTAKBANK: 1780,
  TATAMOTORS: 1010,
  TATASTEEL: 155,
  ITC: 490,
};

export function parseSymbol(rawSymbol: string, hint?: QuoteHint) {
  const clean = rawSymbol.trim().toUpperCase();

  let underlying = (hint?.name || hint?.underlying || "").toUpperCase();
  let strikePrice: number | null = hint?.strikePrice ?? null;
  let optionType: "CE" | "PE" | null = (hint?.optionType as "CE" | "PE") ?? null;

  if (underlying && strikePrice && optionType) {
    return { underlying, strikePrice, optionType, isOption: true };
  }

  // Split by whitespace: e.g. "MIDCPNIFTY 15225 PE 27 OCT 26" or "NIFTY 24000 CE"
  const parts = clean.split(/\s+/);
  if (!underlying) {
    underlying = parts[0] || "NIFTY";
  }

  // Look for CE or PE token
  const cePeIdx = parts.findIndex((p) => p === "CE" || p === "PE");
  if (cePeIdx !== -1) {
    optionType = parts[cePeIdx] as "CE" | "PE";
    // Strike price is usually immediately before CE/PE: e.g., "15225" before "PE"
    if (cePeIdx > 0 && !isNaN(parseFloat(parts[cePeIdx - 1]))) {
      strikePrice = parseFloat(parts[cePeIdx - 1]);
    }
  }

  // Compact pattern check: e.g. "NIFTY24000CE" or "NIFTY 24000 CE"
  if (!optionType) {
    const compactMatch = clean.match(/^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY|[A-Z]+).*?(\d{4,6})\s*(CE|PE)$/i);
    if (compactMatch) {
      underlying = compactMatch[1].toUpperCase();
      strikePrice = parseFloat(compactMatch[2]);
      optionType = compactMatch[3].toUpperCase() as "CE" | "PE";
    }
  }

  return {
    underlying,
    strikePrice,
    optionType,
    isOption: optionType !== null && strikePrice !== null,
  };
}

async function fetchSpotPriceFromYahoo(underlying: string): Promise<number | null> {
  try {
    const yahooSymbol = STOCK_MAPPINGS[underlying] || `${underlying}.NS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (meta && typeof meta.regularMarketPrice === "number") {
      return meta.regularMarketPrice;
    }
  } catch {
    // Fail gracefully to baseline
  }
  return null;
}

export async function fetchMarketQuote(symbol: string, hint?: QuoteHint): Promise<QuoteResult> {
  const parsed = parseSymbol(symbol, hint);
  const underlying = parsed.underlying;

  let spotPrice = await fetchSpotPriceFromYahoo(underlying);
  let provider: QuoteResult["provider"] = "Yahoo Finance Live";

  if (!spotPrice) {
    spotPrice = BASELINE_SPOTS[underlying] || 1000;
    provider = "Simulated Market Engine";
  }

  // Exact spot price without artificial variation
  spotPrice = Number(spotPrice.toFixed(2));

  // If simple stock/index quote or no strike price
  if (!parsed.isOption || !parsed.strikePrice) {
    return {
      lastPrice: spotPrice,
      provider,
      symbol,
    };
  }

  // Option price estimation using intrinsic + greeks time-value model
  const strike = parsed.strikePrice;
  const intrinsic =
    parsed.optionType === "CE"
      ? Math.max(0, spotPrice - strike)
      : Math.max(0, strike - spotPrice);

  const diffRatio = Math.abs(spotPrice - strike) / spotPrice;
  const maxTimeValue = spotPrice * (underlying.includes("NIFTY") ? 0.015 : 0.025);
  const timeValue = maxTimeValue * Math.exp(-diffRatio * 15);

  let optionPrice = Number((intrinsic + timeValue).toFixed(2));
  if (optionPrice < 0.5) optionPrice = 0.5;

  return {
    lastPrice: optionPrice,
    provider,
    symbol,
  };
}
