import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const openTrades = await prisma.trade.findMany({
      where: { userId: user.id, status: "OPEN" },
    });

    if (openTrades.length === 0) {
      return NextResponse.json({ message: "No open positions to close.", count: 0 });
    }

    const now = new Date();

    // Close all open positions in a batch
    await prisma.$transaction(
      openTrades.map((t) => {
        const exitPrice = t.currentPrice ?? t.entryPrice;
        const pnl = t.side === "BUY"
          ? (exitPrice - t.entryPrice) * t.quantity
          : (t.entryPrice - exitPrice) * t.quantity;

        return prisma.trade.update({
          where: { id: t.id },
          data: {
            status: "CLOSED",
            exitPrice,
            closedAt: now,
            pnl: Number(pnl.toFixed(2)),
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully closed ${openTrades.length} open position(s).`,
      count: openTrades.length,
    });
  } catch (err: any) {
    console.error("Bulk close trades error:", err);
    return NextResponse.json({ error: err.message || "Failed to close positions." }, { status: 500 });
  }
}
