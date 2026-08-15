import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please login to subscribe." }, { status: 401 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const planAmountPaise = 14900; // ₹149 in paise (149 * 100)

  // If Razorpay API keys are configured, create real Razorpay Order
  if (keyId && keySecret) {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount: planAmountPaise,
        currency: "INR",
        receipt: `rcpt_${user.id.slice(-6)}_${Date.now()}`,
        notes: {
          userId: user.id,
          userEmail: user.email,
          plan: "PRO_MONTHLY",
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        demoMode: false,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to create Razorpay order" }, { status: 500 });
    }
  }

  // Demo mode fallback if keys are not set in .env yet
  const demoOrderId = `order_demo_${Date.now()}`;
  return NextResponse.json({
    orderId: demoOrderId,
    amount: planAmountPaise,
    currency: "INR",
    keyId: keyId || "rzp_test_demo",
    demoMode: true,
  });
}
