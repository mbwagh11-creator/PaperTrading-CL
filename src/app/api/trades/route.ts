import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateSubscriptionStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// Helper to check official NSE Market Hours (Mon-Fri 9:15 AM to 3:30 PM IST)
function isNseMarketOpenNow(): boolean {
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

  return isWeekday && isMarketHours;
}

// GET /api/trades?status=OPEN|CLOSED  (omit status to get all)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as "OPEN" | "CLOSED" } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trades);
}

// POST /api/trades  -> open a new paper trade
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard 1: Reject trades if market is closed
  if (!isNseMarketOpenNow()) {
    return NextResponse.json(
      {
        error:
          "Order Rejected: NSE Market is currently CLOSED. Trading is strictly permitted only during live market hours (Mon-Fri 9:15 AM - 3:30 PM IST).",
        marketClosed: true,
      },
      { status: 400 }
    );
  }

  // Guard 2: Reject trades against expired trial
  const sub = calculateSubscriptionStatus(user);
  if (sub.status === "EXPIRED") {
    return NextResponse.json(
      {
        error:
          "Your 7-day free trial has expired. Please subscribe at ₹149/month on the Pricing page to place new trades.",
        expired: true,
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { symbol, side, quantity, entryPrice, stopLoss, target, notes, instrumentKey } = body;

  if (!symbol || !side || !quantity || !entryPrice) {
    return NextResponse.json(
      { error: "symbol, side, quantity and entryPrice are required" },
      { status: 400 }
    );
  }

  if (side !== "BUY" && side !== "SELL") {
    return NextResponse.json({ error: "side must be BUY or SELL" }, { status: 400 });
  }

  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      symbol: String(symbol).toUpperCase(),
      instrumentKey: instrumentKey || null,
      side,
      quantity: Number(quantity),
      entryPrice: Number(entryPrice),
      currentPrice: Number(entryPrice),
      stopLoss: stopLoss ? Number(stopLoss) : null,
      target: target ? Number(target) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(trade, { status: 201 });
}
