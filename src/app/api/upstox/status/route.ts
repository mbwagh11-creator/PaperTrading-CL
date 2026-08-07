import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/upstox/status - tells the frontend whether a live Upstox session is active,
// so it can show live-price controls instead of the manual entry fallback.
export async function GET() {
  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });

  if (!session) {
    return NextResponse.json({ connected: false });
  }

  // Upstox tokens always expire at 3:30 AM IST the day after they're issued.
  const updated = new Date(session.updatedAt);
  const expiry = new Date(updated);
  expiry.setUTCHours(22, 0, 0, 0); // 3:30 AM IST == 22:00 UTC previous day
  if (expiry <= updated) expiry.setUTCDate(expiry.getUTCDate() + 1);

  const connected = new Date() < expiry;

  return NextResponse.json({
    connected,
    userName: session.userName,
    expiresAt: expiry.toISOString(),
  });
}
