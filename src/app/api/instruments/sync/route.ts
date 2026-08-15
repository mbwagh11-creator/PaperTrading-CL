import { NextResponse } from "next/server";
import { syncNseInstruments } from "@/lib/instruments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/instruments/sync - downloads Upstox's public instrument master
// and refreshes the local searchable list. No API key required.
export async function POST() {
  try {
    const result = await syncNseInstruments();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/instruments/sync - quick status check (how many instruments cached, when last synced)
export async function GET() {
  const count = await prisma.instrument.count();
  const latest = await prisma.instrument.findFirst({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ count, lastSyncedAt: latest?.updatedAt ?? null });
}
