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

// Fallback option matrix generator when NSE API is rate-limited or closed
function generateFallbackOptionChain(symbol: string, spotPrice: number) {
  const strikeInterval = symbol === "BANKNIFTY" ? 100 : 50;
  const baseStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
  const strikes: number[] = [];

  for (let i = -6; i <= 6; i++) {
    strikes.push(baseStrike + i * strikeInterval);
  }

  const baseIV = symbol === "BANKNIFTY" ? 16.8 : 14.2;
  const timeVal = symbol === "BANKNIFTY" ? 185 : 95;

  const records: OptionRecord[] = strikes.map((strike) => {
    const ceDiff = spotPrice - strike;
    const peDiff = strike - spotPrice;

    const ceIntrinsic = Math.max(0, ceDiff);
    const peIntrinsic = Math.max(0, peDiff);

    const cePrice = Number(Math.max(15, ceIntrinsic + timeVal * 0.6).toFixed(2));
    const pePrice = Number(Math.max(15, peIntrinsic + timeVal * 0.6).toFixed(2));

    const diffRatio = Math.abs(spotPrice - strike) / spotPrice;
    const iv = Number((baseIV + diffRatio * 10).toFixed(1));

    const volume = Math.round(150000 * Math.max(0.2, 1 - diffRatio * 5));
    const oi = Math.round(volume * 3.2);

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
        impliedVolatility: iv,
        lastPrice: cePrice,
        change: Number((cePrice * 0.01).toFixed(2)),
        pChange: 1.2,
        totalBuyQuantity: 5000,
        totalSellQuantity: 4800,
        underlyingValue: spotPrice,
      },
      PE: {
        strikePrice: strike,
        underlying: symbol,
        identifier: `${symbol}${strike}PE`,
        openInterest: Math.round(oi * 0.9),
        changeinOpenInterest: Math.round(oi * 0.04),
        pchangeinOpenInterest: 4.1,
        totalTradedVolume: Math.round(volume * 0.85),
        impliedVolatility: iv,
        lastPrice: pePrice,
        change: Number((-pePrice * 0.01).toFixed(2)),
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

  try {
    // 1. Obtain cookies from NSE home page
    const sessionRes = await fetch("https://www.nseindia.com", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 30 },
    });

    const setCookieHeaders = sessionRes.headers.getSetCookie?.() || [];
    const cookieHeader = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");

    // 2. Query NSE official Option Chain API
    const nseUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${cleanSymbol}`;
    const nseRes = await fetch(nseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com/option-chain",
        "Cookie": cookieHeader,
      },
      next: { revalidate: 0 },
    });

    if (nseRes.ok) {
      const data = await nseRes.json();
      const rawRecords: OptionRecord[] = data?.filtered?.data || data?.records?.data || [];
      const underlyingValue: number =
        data?.records?.underlyingValue || data?.filtered?.records?.[0]?.CE?.underlyingValue || (cleanSymbol === "BANKNIFTY" ? 57500 : 24350);

      if (rawRecords.length > 0) {
        // Filter strikes around the underlying value (10 strikes below and 10 above)
        const strikeInterval = cleanSymbol === "BANKNIFTY" ? 100 : 50;
        const baseStrike = Math.round(underlyingValue / strikeInterval) * strikeInterval;

        const filtered = rawRecords
          .filter((r) => r.strikePrice >= baseStrike - strikeInterval * 6 && r.strikePrice <= baseStrike + strikeInterval * 6)
          .sort((a, b) => a.strikePrice - b.strikePrice);

        return NextResponse.json({
          success: true,
          symbol: cleanSymbol,
          underlyingValue,
          baseStrike,
          records: filtered,
          timestamp: data?.records?.timestamp || new Date().toISOString(),
          isFallback: false,
        });
      }
    }
  } catch (err) {
    console.warn("NSE Live Option Chain fetch error, using educational model fallback:", err);
  }

  // Fallback if live NSE API call fails or rate-limits
  const defaultSpot = cleanSymbol === "BANKNIFTY" ? 57624.1 : 24343.2;
  const fallbackData = generateFallbackOptionChain(cleanSymbol, defaultSpot);

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
