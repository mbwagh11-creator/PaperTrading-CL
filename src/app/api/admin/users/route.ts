import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isUserAdmin } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const isOwner = isUserAdmin(currentUser);

    if (!currentUser || !isOwner) {
      return NextResponse.json({ error: "Unauthorized access. Owner admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json({ error: "action and userId are required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    // -------------------------------------------------------------
    // ACTION 1: EXTEND FREE TRIAL BY +7 DAYS
    // -------------------------------------------------------------
    if (action === "extend_trial") {
      const currentEnd = targetUser.trialEndsAt && new Date(targetUser.trialEndsAt) > new Date()
        ? new Date(targetUser.trialEndsAt)
        : new Date();

      const newTrialEnd = new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "TRIAL",
          trialEndsAt: newTrialEnd,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Extended free trial by +7 days for ${updated.email}! New trial end: ${newTrialEnd.toLocaleDateString("en-IN")}`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: GRANT PRO SUBSCRIPTION (30 DAYS)
    // -------------------------------------------------------------
    if (action === "grant_pro") {
      const newProEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: newProEnd,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Granted 30-Day PRO Subscription to ${updated.email}! Expiration: ${newProEnd.toLocaleDateString("en-IN")}`,
        user: updated,
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: GRANT LIFETIME VIP ACCESS
    // -------------------------------------------------------------
    if (action === "grant_lifetime") {
      const lifetimeEnd = new Date("2099-12-31");

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "LIFETIME",
          subscriptionEndsAt: lifetimeEnd,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Granted Lifetime VIP PRO Access to ${updated.email}!`,
        user: updated,
      });
    }

    return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin user action error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute admin action" }, { status: 500 });
  }
}
