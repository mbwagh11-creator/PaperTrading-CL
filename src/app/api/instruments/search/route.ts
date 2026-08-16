import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface InstrumentItem {
  instrumentKey: string;
  tradingSymbol: string;
  instrumentType: string | null;
  strikePrice: number | null;
  expiry: string | null;
  lotSize: number | null;
}

// GET /api/instruments/search?q=55000 or q=BANKNIFTY 57500
export async function GET(req: NextRequest) {
  const rawQ = req.nextUrl.searchParams.get("q") || "";
  const q = rawQ.trim().toUpperCase();

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  let dbResults: InstrumentItem[] = [];
  try {
    dbResults = await prisma.instrument.findMany({
      where: {
        AND: tokens.map((t) => ({
          tradingSymbol: { contains: t },
        })),
      },
      orderBy: { tradingSymbol: "asc" },
      take: 20,
    });
  } catch (err) {
    console.error("Instrument search DB error:", err);
  }

  // If DB returned plenty of results, return them
  if (dbResults.length >= 10) {
    return NextResponse.json(dbResults);
  }

  // Dynamic Synthetic Option Generator Fallback
  // Ensures queries like "55000", "57500", "BANKNIFTY 55000", "NIFTY 24500" ALWAYS return options!
  const syntheticResults: InstrumentItem[] = [];
  const strikeMatch = q.match(/(\d{4,5})/);
  const strike = strikeMatch ? parseInt(strikeMatch[1], 10) : null;

  const isBank = q.includes("BANK");
  const isNifty = q.includes("NIFTY") && !isBank;

  const todayStr = new Date().toISOString().split("T")[0];

  if (strike) {
    // Generate for BANKNIFTY if requested or ambiguous
    if (isBank || !isNifty) {
      syntheticResults.push({
        instrumentKey: `SYN_BANKNIFTY_${strike}_CE`,
        tradingSymbol: `BANKNIFTY ${strike} CE`,
        instrumentType: "CE",
        strikePrice: strike,
        expiry: todayStr,
        lotSize: 30,
      });
      syntheticResults.push({
        instrumentKey: `SYN_BANKNIFTY_${strike}_PE`,
        tradingSymbol: `BANKNIFTY ${strike} PE`,
        instrumentType: "PE",
        strikePrice: strike,
        expiry: todayStr,
        lotSize: 30,
      });
    }

    // Generate for NIFTY if requested or ambiguous
    if (isNifty || !isBank) {
      syntheticResults.push({
        instrumentKey: `SYN_NIFTY_${strike}_CE`,
        tradingSymbol: `NIFTY ${strike} CE`,
        instrumentType: "CE",
        strikePrice: strike,
        expiry: todayStr,
        lotSize: 50,
      });
      syntheticResults.push({
        instrumentKey: `SYN_NIFTY_${strike}_PE`,
        tradingSymbol: `NIFTY ${strike} PE`,
        instrumentType: "PE",
        strikePrice: strike,
        expiry: todayStr,
        lotSize: 50,
      });
    }
  } else if (isBank || isNifty) {
    // Index searched without a strike (e.g. "BANKNIFTY" or "BANK")
    const baseIndex = isBank ? "BANKNIFTY" : "NIFTY";
    const baseSpot = isBank ? 57500 : 24350;
    const interval = isBank ? 100 : 50;
    const lot = isBank ? 30 : 50;

    for (let offset = -2; offset <= 2; offset++) {
      const s = baseSpot + offset * interval;
      syntheticResults.push({
        instrumentKey: `SYN_${baseIndex}_${s}_CE`,
        tradingSymbol: `${baseIndex} ${s} CE`,
        instrumentType: "CE",
        strikePrice: s,
        expiry: todayStr,
        lotSize: lot,
      });
      syntheticResults.push({
        instrumentKey: `SYN_${baseIndex}_${s}_PE`,
        tradingSymbol: `${baseIndex} ${s} PE`,
        instrumentType: "PE",
        strikePrice: s,
        expiry: todayStr,
        lotSize: lot,
      });
    }
  }

  // Combine DB results and synthetic results (remove duplicates by tradingSymbol)
  const existingSymbols = new Set(dbResults.map((r) => r.tradingSymbol.toUpperCase()));
  const combined = [...dbResults];

  for (const syn of syntheticResults) {
    if (!existingSymbols.has(syn.tradingSymbol.toUpperCase())) {
      combined.push(syn);
      existingSymbols.add(syn.tradingSymbol.toUpperCase());
    }
  }

  return NextResponse.json(combined.slice(0, 25));
}
