import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isUserAdmin } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const isOwner = isUserAdmin(currentUser);

    if (!currentUser || !isOwner) {
      return NextResponse.json(
        { error: "Unauthorized access. Admin privileges required." },
        { status: 403 }
      );
    }

    const totalUsers = await prisma.user.count().catch(() => 0);
    const activeProSubscribers = await prisma.user.count({
      where: {
        OR: [
          { subscriptionStatus: "ACTIVE" },
          { subscriptionStatus: "LIFETIME" },
        ],
      },
    }).catch(() => 0);

    const trialUsers = await prisma.user.count({
      where: { subscriptionStatus: "TRIAL" },
    }).catch(() => 0);

    const expiredUsers = await prisma.user.count({
      where: { subscriptionStatus: "EXPIRED" },
    }).catch(() => 0);

    const totalTrades = await prisma.trade.count().catch(() => 0);

    const recentUsers = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeProSubscribers,
        trialUsers,
        expiredUsers,
        totalTrades,
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        trialEndsAt: u.trialEndsAt ? u.trialEndsAt.toISOString() : null,
        subscriptionEndsAt: u.subscriptionEndsAt ? u.subscriptionEndsAt.toISOString() : null,
      })),
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch admin stats" }, { status: 500 });
  }
}
