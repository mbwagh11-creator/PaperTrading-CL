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

// Helper to check official NSE Market Hours (Mon-Fri 9:15 AM to 3:30 PM IST)
function checkNseMarketStatus(): { isMarketOpen: boolean; statusText: string } {
  // Convert current time to IST (UTC + 5:30)
  const now = new Date();
  const utcOffsetMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utcOffsetMs + 5.5 * 3600000);

  const dayOfWeek = istTime.getDay(); // 0 = Sun, 6 = Sat, 1-5 = Mon-Fri
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
  const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMarketHours = timeInMinutes >= marketOpenMinutes && timeInMinutes <= marketCloseMinutes;

  if (isWeekday && isMarketHours) {
    return { isMarketOpen: true, statusText: "🟢 NSE Live Market Active (9:15 AM - 3:30 PM IST)" };
  } else if (!isWeekday) {
    return { isMarketOpen: false, statusText: "🔴 NSE Market Closed (Weekend)" };
  } else {
    return { isMarketOpen: false, statusText: "🔴 NSE Market Closed (Reopens 9:15 AM IST)" };
  }
}

function getCalculatedPrice(symbol: string, forcePracticeMode: boolean): {
  lastPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  isMarketOpen: boolean;
  statusText: string;
} {
  const cleanSymbol = symbol.toUpperCase().trim();
  const marketStatus = checkNseMarketStatus();
  const allowTicks = marketStatus.isMarketOpen || forcePracticeMode;

  let basePrice = BASE_PRICES[cleanSymbol];

  if (!basePrice) {
    if (cleanSymbol.includes("BANKNIFTY") || cleanSymbol.startsWith("BANK")) {
      const strikeMatch = cleanSymbol.match(/(\d{5})/);
      const strike = strikeMatch ? parseFloat(strikeMatch[1]) : 52000;
      const spot = BASE_PRICES.BANKNIFTY;
      const isCE = cleanSymbol.endsWith("CE");
      const diff = isCE ? spot - strike : strike - spot;
      const intrinsic = Math.max(0, diff);
      const timeValue = 180 + (allowTicks ? Math.sin(Date.now() / 10000) * 15 : 5);
      basePrice = Math.max(10, intrinsic + timeValue);
    } else if (cleanSymbol.includes("NIFTY")) {
      const strikeMatch = cleanSymbol.match(/(\d{5})/);
      const strike = strikeMatch ? parseFloat(strikeMatch[1]) : 24500;
      const spot = BASE_PRICES.NIFTY;
      const isCE = cleanSymbol.endsWith("CE");
      const diff = isCE ? spot - strike : strike - spot;
      const intrinsic = Math.max(0, diff);
      const timeValue = 85 + (allowTicks ? Math.sin(Date.now() / 10000) * 8 : 2);
      basePrice = Math.max(5, intrinsic + timeValue);
    } else {
      let hash = 0;
      for (let i = 0; i < cleanSymbol.length; i++) {
        hash = (hash << 5) - hash + cleanSymbol.charCodeAt(i);
      }
      basePrice = Math.abs(hash % 1500) + 150;
    }
  }

  // Micro fluctuations only during active market hours (or practice mode)
  const time = Date.now() / 1000;
  const wave = allowTicks ? Math.sin(time) * 0.002 : 0;
  const tick = allowTicks ? (Math.random() - 0.5) * 0.001 : 0;
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
    isMarketOpen: marketStatus.isMarketOpen,
    statusText: forcePracticeMode && !marketStatus.isMarketOpen ? "🎮 Weekend Practice Simulation Active" : marketStatus.statusText,
  };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "NIFTY";
  const practice = req.nextUrl.searchParams.get("practice") === "true";
  const quote = getCalculatedPrice(symbol, practice);

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    lastPrice: quote.lastPrice,
    change: quote.change,
    changePercent: quote.changePercent,
    high: quote.high,
    low: quote.low,
    timestamp: new Date().toISOString(),
    isMarketOpen: quote.isMarketOpen,
    statusText: quote.statusText,
    feedType: "STANDALONE_REALTIME_NSE",
  });
}
