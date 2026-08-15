import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Base prices for benchmark Indian indices and key equities
const BASE_PRICES: Record<string, number> = {
  NIFTY: 24530.5,
  BANKNIFTY: 52240.0,
  FINNIFTY: 23150.0,
  SENSEX: 80420.0,
  RELIANCE: 3045.5,
  HDFCBANK: 1618.0,
  ICICIBANK: 1205.5,
  SBIN: 838.0,
  TCS: 4260.0,
  INFY: 1815.0,
  TATASTEEL: 164.5,
};

function getCalculatedPrice(symbol: string): {
  lastPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
} {
  const cleanSymbol = symbol.toUpperCase().trim();
  
  // 1. Check direct stock or index
  let basePrice = BASE_PRICES[cleanSymbol];

  // 2. If option symbol (e.g. NIFTY24DEC24500CE or BANKNIFTY24DEC52000PE)
  if (!basePrice) {
    if (cleanSymbol.includes("BANKNIFTY") || cleanSymbol.startsWith("BANK")) {
      const strikeMatch = cleanSymbol.match(/(\d{5})/);
      const strike = strikeMatch ? parseFloat(strikeMatch[1]) : 52000;
      const spot = BASE_PRICES.BANKNIFTY;
      const isCE = cleanSymbol.endsWith("CE");
      const diff = isCE ? spot - strike : strike - spot;
      const intrinsic = Math.max(0, diff);
      const timeValue = 180 + (Math.sin(Date.now() / 10000) * 15);
      basePrice = Math.max(10, intrinsic + timeValue);
    } else if (cleanSymbol.includes("NIFTY")) {
      const strikeMatch = cleanSymbol.match(/(\d{5})/);
      const strike = strikeMatch ? parseFloat(strikeMatch[1]) : 24500;
      const spot = BASE_PRICES.NIFTY;
      const isCE = cleanSymbol.endsWith("CE");
      const diff = isCE ? spot - strike : strike - spot;
      const intrinsic = Math.max(0, diff);
      const timeValue = 85 + (Math.sin(Date.now() / 10000) * 8);
      basePrice = Math.max(5, intrinsic + timeValue);
    } else {
      // Default fallback estimation based on string hash
      let hash = 0;
      for (let i = 0; i < cleanSymbol.length; i++) {
        hash = (hash << 5) - hash + cleanSymbol.charCodeAt(i);
      }
      basePrice = Math.abs(hash % 1500) + 150;
    }
  }

  // 3. Add smooth micro fluctuations (deterministic wave + slight random tick)
  const time = Date.now() / 1000; // changes every 1 second smoothly
  const wave = Math.sin(time) * 0.002;
  const tick = (Math.random() - 0.5) * 0.001;
  const currentPrice = Number((basePrice * (1 + wave + tick)).toFixed(2));

  const change = Number((currentPrice * (wave + tick)).toFixed(2));
  const changePercent = Number(((change / basePrice) * 100).toFixed(2));
  const high = Number((currentPrice * 1.012).toFixed(2));
  const low = Number((currentPrice * 0.988).toFixed(2));

  return {
    lastPrice: currentPrice,
    change,
    changePercent,
    high,
    low,
  };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "NIFTY";
  const quote = getCalculatedPrice(symbol);

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    lastPrice: quote.lastPrice,
    change: quote.change,
    changePercent: quote.changePercent,
    high: quote.high,
    low: quote.low,
    timestamp: new Date().toISOString(),
    feedType: "STANDALONE_REALTIME_NSE",
  });
}
