import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please login to verify payment." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, demoMode } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Verify Signature if not in demo mode
    if (!demoMode && keySecret) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: "Invalid payment verification details." }, { status: 400 });
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Payment verification failed: Signature mismatch." }, { status: 400 });
      }
    }

    const paymentId = razorpay_payment_id || `PAY_DEMO_${Date.now()}`;

    // Add 30 days from current date (or extend active subscription)
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
      message: "🎉 Payment verified! PRO-TRADER Monthly Plan activated for 30 days.",
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt?.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process payment verification" }, { status: 500 });
  }
}
