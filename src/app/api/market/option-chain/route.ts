import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OptionRecord {
  strikePrice: number;
  expiryDate?: string;
  CE?: {
    strikePrice: number;
    underlying: string;
    identifier: string;
    openInterest: number;
    changeinOpenInterest: number;
    pchangeinOpenInterest: number;
    totalTradedVolume: number;
    impliedVolatility: number;
    lastPrice: number;
    change: number;
    pChange: number;
    totalBuyQuantity: number;
    totalSellQuantity: number;
    underlyingValue: number;
  };
  PE?: {
    strikePrice: number;
    underlying: string;
    identifier: string;
    openInterest: number;
    changeinOpenInterest: number;
    pchangeinOpenInterest: number;
    totalTradedVolume: number;
    impliedVolatility: number;
    lastPrice: number;
    change: number;
    pChange: number;
    totalBuyQuantity: number;
    totalSellQuantity: number;
    underlyingValue: number;
  };
}

// Approximation of standard normal CDF for Black-Scholes
function cdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t *
      (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Mathematically accurate Black-Scholes pricing engine
function calculateBlackScholesOption(
  S: number, // Spot price
  K: number, // Strike price
  isCE: boolean,
  baseIV: number = 0.16
) {
  const T = 5 / 365; // ~5 days to weekly expiry
  const r = 0.065; // 6.5% interest rate

  // Volatility smile: OTM options have slightly higher IV
  const logMoneyness = Math.abs(Math.log(S / K));
  const sigma = baseIV + logMoneyness * 0.15;

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let rawPrice = 0;
  if (isCE) {
    rawPrice = S * cdf(d1) - K * Math.exp(-r * T) * cdf(d2);
  } else {
    rawPrice = K * Math.exp(-r * T) * cdf(-d2) - S * cdf(-d1);
  }

  // Minimum tick price floor of ₹15.00
  const price = Number(Math.max(15, rawPrice).toFixed(1));
  const iv = Number((sigma * 100).toFixed(1));

  return { price, iv };
}

// Fetch live spot index price from Yahoo Finance
async function fetchYahooSpot(symbol: string): Promise<number | null> {
  const yahooTicker = symbol === "BANKNIFTY" ? "^NSEBANK" : "^NSEI";
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1m&range=1d`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price && price > 0 ? Number(price) : null;
  } catch {
    return null;
  }
}

// Fallback option matrix generator with realistic Black-Scholes pricing
function generateOptionChainFromSpot(symbol: string, spotPrice: number) {
  const strikeInterval = symbol === "BANKNIFTY" ? 100 : 50;
  const baseStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
  const strikes: number[] = [];

  for (let i = -6; i <= 6; i++) {
    strikes.push(baseStrike + i * strikeInterval);
  }

  const baseIV = symbol === "BANKNIFTY" ? 0.168 : 0.142;

  const records: OptionRecord[] = strikes.map((strike) => {
    const ce = calculateBlackScholesOption(spotPrice, strike, true, baseIV);
    const pe = calculateBlackScholesOption(spotPrice, strike, false, baseIV);

    const diffRatio = Math.abs(spotPrice - strike) / spotPrice;
    const volume = Math.round(180000 * Math.max(0.2, 1 - diffRatio * 5));
    const oi = Math.round(volume * 2.8 + (strike % 500) * 45);

    return {
      strikePrice: strike,
      CE: {
        strikePrice: strike,
        underlying: symbol,
        identifier: `${symbol}${strike}CE`,
        openInterest: oi,
        changeinOpenInterest: Math.round(oi * 0.05),
        pchangeinOpenInterest: 5.2,
        totalTradedVolume: volume,
        impliedVolatility: ce.iv,
        lastPrice: ce.price,
        change: Number((ce.price * 0.01).toFixed(2)),
        pChange: 1.2,
        totalBuyQuantity: 5000,
        totalSellQuantity: 4800,
        underlyingValue: spotPrice,
      },
      PE: {
        strikePrice: strike,
        underlying: symbol,
        identifier: `${symbol}${strike}PE`,
        openInterest: Math.round(oi * 0.92),
        changeinOpenInterest: Math.round(oi * 0.04),
        pchangeinOpenInterest: 4.1,
        totalTradedVolume: Math.round(volume * 0.85),
        impliedVolatility: pe.iv,
        lastPrice: pe.price,
        change: Number((-pe.price * 0.01).toFixed(2)),
        pChange: -1.1,
        totalBuyQuantity: 4200,
        totalSellQuantity: 4500,
        underlyingValue: spotPrice,
      },
    };
  });

  return {
    records,
    underlyingValue: spotPrice,
    baseStrike,
    isFallback: true,
  };
}

export async function GET(req: NextRequest) {
  const symbolParam = req.nextUrl.searchParams.get("symbol") || "NIFTY";
  const cleanSymbol = symbolParam.toUpperCase().includes("BANK") ? "BANKNIFTY" : "NIFTY";

  // Try live Yahoo spot price first for instant responsiveness
  const liveSpot = await fetchYahooSpot(cleanSymbol);
  const defaultSpot = liveSpot || (cleanSymbol === "BANKNIFTY" ? 57624.1 : 24343.2);

  try {
    // Attempt NSE Direct Scraping
    const sessionRes = await fetch("https://www.nseindia.com", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 60 },
    });

    const setCookieHeaders = sessionRes.headers.getSetCookie?.() || [];
    const cookieHeader = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");

    const nseUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${cleanSymbol}`;
    const nseRes = await fetch(nseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.nseindia.com/option-chain",
        "Cookie": cookieHeader,
      },
      next: { revalidate: 0 },
    });

    if (nseRes.ok) {
      const data = await nseRes.json();
      const rawRecords: OptionRecord[] = data?.filtered?.data || data?.records?.data || [];
      const nseUnderlying: number =
        data?.records?.underlyingValue || data?.filtered?.records?.[0]?.CE?.underlyingValue || defaultSpot;

      if (rawRecords.length > 0) {
        const strikeInterval = cleanSymbol === "BANKNIFTY" ? 100 : 50;
        const baseStrike = Math.round(nseUnderlying / strikeInterval) * strikeInterval;

        const filtered = rawRecords
          .filter((r) => r.strikePrice >= baseStrike - strikeInterval * 6 && r.strikePrice <= baseStrike + strikeInterval * 6)
          .sort((a, b) => a.strikePrice - b.strikePrice);

        return NextResponse.json({
          success: true,
          symbol: cleanSymbol,
          underlyingValue: nseUnderlying,
          baseStrike,
          records: filtered,
          timestamp: data?.records?.timestamp || new Date().toISOString(),
          isFallback: false,
        });
      }
    }
  } catch (err) {
    console.warn("NSE fetch fallback:", err);
  }

  // Fallback using Black-Scholes pricing with dynamic live spot price
  const fallbackData = generateOptionChainFromSpot(cleanSymbol, defaultSpot);

  return NextResponse.json({
    success: true,
    symbol: cleanSymbol,
    underlyingValue: fallbackData.underlyingValue,
    baseStrike: fallbackData.baseStrike,
    records: fallbackData.records,
    timestamp: new Date().toISOString(),
    isFallback: true,
  });
}
