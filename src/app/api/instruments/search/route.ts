import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/instruments/search?q=NIFTY
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toUpperCase();

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await prisma.instrument.findMany({
    where: { tradingSymbol: { contains: q } },
    orderBy: { tradingSymbol: "asc" },
    take: 20,
  });

  return NextResponse.json(results);
}
