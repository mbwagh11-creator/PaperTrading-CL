import { gunzipSync } from "zlib";
import { prisma } from "@/lib/prisma";

const NSE_INSTRUMENTS_URL = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

const WATCHLIST_UNDERLYINGS = [
  "NIFTY",
  "BANKNIFTY",
  "FINNIFTY",
  "MIDCPNIFTY",
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "TATAMOTORS",
  "TATASTEEL",
  "AXISBANK",
  "KOTAKBANK",
  "ITC",
];

interface RawInstrument {
  instrument_key: string;
  exchange: string;
  trading_symbol?: string;
  tradingsymbol?: string;
  name?: string;
  instrument_type?: string;
  strike_price?: number;
  expiry?: string;
  lot_size?: number;
  segment?: string;
}

export interface SyncResult {
  fetched: number;
  kept: number;
}

function formatExpiry(val: string | number | undefined | null): string | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") {
    const date = new Date(val > 1e11 ? val : val * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return String(val);
  }
  if (typeof val === "string") {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== "") {
      const date = new Date(num > 1e11 ? num : num * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }
    return val;
  }
  return String(val);
}

export async function syncNseInstruments(): Promise<SyncResult> {
  const res = await fetch(NSE_INSTRUMENTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to download instrument master: HTTP ${res.status}`);
  }

  const gzipped = Buffer.from(await res.arrayBuffer());
  const json = gunzipSync(gzipped).toString("utf-8");
  const all: RawInstrument[] = JSON.parse(json);

  const relevant = all.filter((inst) => {
    const symbol = (inst.trading_symbol || inst.tradingsymbol || inst.name || "").toUpperCase();
    return WATCHLIST_UNDERLYINGS.some((u) => symbol.startsWith(u));
  });

  const BATCH = 200;
  for (let i = 0; i < relevant.length; i += BATCH) {
    const batch = relevant.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((inst) => {
        const expiryStr = formatExpiry(inst.expiry);
        const tradingSym = inst.trading_symbol || inst.tradingsymbol || inst.name || "";
        return prisma.instrument.upsert({
          where: { instrumentKey: inst.instrument_key },
          create: {
            instrumentKey: inst.instrument_key,
            exchange: inst.exchange,
            tradingSymbol: tradingSym,
            name: inst.name ?? null,
            instrumentType: inst.instrument_type ?? null,
            strikePrice: inst.strike_price ?? null,
            expiry: expiryStr,
            lotSize: inst.lot_size ?? null,
          },
          update: {
            exchange: inst.exchange,
            tradingSymbol: tradingSym,
            name: inst.name ?? null,
            instrumentType: inst.instrument_type ?? null,
            strikePrice: inst.strike_price ?? null,
            expiry: expiryStr,
            lotSize: inst.lot_size ?? null,
          },
        });
      })
    );
  }

  return { fetched: all.length, kept: relevant.length };
}
