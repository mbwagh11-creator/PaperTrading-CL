import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
      const notes = entity?.notes || {};
      const userId = notes.userId;
      const paymentId = entity?.id || `PAY_WEBHOOK_${Date.now()}`;

      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const now = new Date();
          const currentEnd = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now
            ? new Date(user.subscriptionEndsAt)
            : now;

          const subscriptionEndsAt = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "ACTIVE",
              subscriptionEndsAt,
              paymentId,
            },
          });
        }
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
