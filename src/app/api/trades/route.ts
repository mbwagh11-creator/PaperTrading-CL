import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
