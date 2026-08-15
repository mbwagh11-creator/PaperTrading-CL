import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMarketQuote } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/upstox/quote?instrumentKey=NSE_FO|44412&symbol=NIFTY
// Fetches current last-traded-price using Upstox if connected, or
// fallback to free public market feed / simulator engine if not connected.
export async function GET(req: NextRequest) {
  const instrumentKey = req.nextUrl.searchParams.get("instrumentKey");
  let symbol = req.nextUrl.searchParams.get("symbol");

  if (!instrumentKey && !symbol) {
    return NextResponse.json({ error: "instrumentKey or symbol is required" }, { status: 400 });
  }

  let inst = null;
  if (instrumentKey) {
    inst = await prisma.instrument.findUnique({ where: { instrumentKey } });
  } else if (symbol) {
    inst = await prisma.instrument.findFirst({ where: { tradingSymbol: symbol } });
  }

  if (!symbol && inst) {
    symbol = inst.tradingSymbol;
  }

  // 1. Try Upstox API if a valid session exists
  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });
  
  if (session && (instrumentKey || inst?.instrumentKey)) {
    const keyToFetch = instrumentKey || inst?.instrumentKey;
    try {
      const url = new URL("https://api.upstox.com/v3/market-quote/ltp");
      url.searchParams.set("instrument_key", keyToFetch!);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        const entry = Object.values(data.data || {}).find(
          (v: any) => v.instrument_token === keyToFetch || v.instrument_key === keyToFetch
        ) as { last_price?: number } | undefined;

        if (entry && typeof entry.last_price === "number") {
          return NextResponse.json({
            lastPrice: entry.last_price,
            provider: "Upstox Live",
            simulated: false,
          });
        }
      }
    } catch {
      // Fall through to public market quote engine on network/API failure
    }
  }

  // 2. Fallback to free public market data feed + option simulation engine
  const targetSymbol = symbol || instrumentKey || "NIFTY";
  const quote = await fetchMarketQuote(targetSymbol, {
    underlying: inst?.name,
    strikePrice: inst?.strikePrice,
    optionType: inst?.instrumentType,
    name: inst?.name,
  });

  return NextResponse.json({
    lastPrice: quote.lastPrice,
    provider: quote.provider,
    simulated: quote.provider !== "Upstox Live",
  });
}
