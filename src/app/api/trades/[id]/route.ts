import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePnl } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";

interface Params {
  params: { id: string };
}

// PATCH /api/trades/:id
// Body can contain:
//   { currentPrice }              -> update live price on an OPEN trade
//   { exitPrice, close: true }    -> close the trade and lock in realized P&L
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();

  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  if (trade.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (trade.status === "CLOSED") {
    return NextResponse.json({ error: "Trade is already closed" }, { status: 400 });
  }

  // Close the trade
  if (body.close) {
    const exitPrice = Number(body.exitPrice);
    if (!exitPrice) {
      return NextResponse.json({ error: "exitPrice is required to close a trade" }, { status: 400 });
    }

    const pnl = calculatePnl(trade.side as "BUY" | "SELL", trade.entryPrice, exitPrice, trade.quantity);

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        exitPrice,
        currentPrice: exitPrice,
        pnl,
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  }

  // Otherwise, just update the live/current price (simulated live market update)
  if (body.currentPrice !== undefined) {
    const updated = await prisma.trade.update({
      where: { id },
      data: { currentPrice: Number(body.currentPrice) },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

// DELETE /api/trades/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const trade = await prisma.trade.findUnique({ where: { id } });
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  if (trade.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
