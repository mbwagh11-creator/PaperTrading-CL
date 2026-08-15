import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please login to subscribe." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId || `PAY_SUB_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Set 30 days subscription duration from today (or add to existing if active)
    const now = new Date();
    const currentEnd = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now
      ? new Date(user.subscriptionEndsAt)
      : now;

    const subscriptionEndsAt = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt,
        paymentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to PRO-TRADER Monthly plan at ₹149/month!",
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt?.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process subscription" }, { status: 500 });
  }
}
