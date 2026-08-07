import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/upstox/quote?instrumentKey=NSE_FO|44412
// Fetches the current last-traded-price for one instrument using the
// user's stored Upstox access token (from /api/auth/upstox/callback).
export async function GET(req: NextRequest) {
  const instrumentKey = req.nextUrl.searchParams.get("instrumentKey");
  if (!instrumentKey) {
    return NextResponse.json({ error: "instrumentKey is required" }, { status: 400 });
  }

  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });
  if (!session) {
    return NextResponse.json(
      { error: "Not connected to Upstox. Click 'Connect Upstox' first." },
      { status: 401 }
    );
  }

  const url = new URL("https://api.upstox.com/v3/market-quote/ltp");
  url.searchParams.set("instrument_key", instrumentKey);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok || data.status !== "success") {
    return NextResponse.json(
      { error: data.errors?.[0]?.message || "Failed to fetch quote from Upstox" },
      { status: res.status || 500 }
    );
  }

  // Response keys look like "NSE_FO:NIFTY..." - find the entry matching our instrument_token
  const entry = Object.values(data.data || {}).find(
    (v: any) => v.instrument_token === instrumentKey
  ) as { last_price?: number } | undefined;

  if (!entry || entry.last_price === undefined) {
    return NextResponse.json({ error: "No quote returned for this instrument" }, { status: 404 });
  }

  return NextResponse.json({ lastPrice: entry.last_price });
}
