import { gunzipSync } from "zlib";
import { prisma } from "@/lib/prisma";

const NSE_INSTRUMENTS_URL = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";

// To keep the local DB small and search fast, we only keep instruments for these
// underlyings (indices + a starter list of liquid stocks). Add more trading_symbol
// prefixes here any time - the sync just needs to be re-run.
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

/**
 * Downloads Upstox's public NSE instrument master file and stores a filtered,
 * searchable subset in the local database. This is publicly available and
 * requires NO Upstox login or API key - it's just a static file they publish.
 */
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

  // Upsert in batches to avoid one giant transaction
  const BATCH = 200;
  for (let i = 0; i < relevant.length; i += BATCH) {
    const batch = relevant.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((inst) =>
        prisma.instrument.upsert({
          where: { instrumentKey: inst.instrument_key },
          create: {
            instrumentKey: inst.instrument_key,
            exchange: inst.exchange,
            tradingSymbol: inst.trading_symbol || inst.tradingsymbol || inst.name || "",
            name: inst.name ?? null,
            instrumentType: inst.instrument_type ?? null,
            strikePrice: inst.strike_price ?? null,
            expiry: inst.expiry ?? null,
            lotSize: inst.lot_size ?? null,
          },
          update: {
            exchange: inst.exchange,
            tradingSymbol: inst.trading_symbol || inst.tradingsymbol || inst.name || "",
            name: inst.name ?? null,
            instrumentType: inst.instrument_type ?? null,
            strikePrice: inst.strike_price ?? null,
            expiry: inst.expiry ?? null,
            lotSize: inst.lot_size ?? null,
          },
        })
      )
    );
  }

  return { fetched: all.length, kept: relevant.length };
}
