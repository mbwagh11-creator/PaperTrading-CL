import { prisma } from "@/lib/prisma";

export interface UserSubscriptionInfo {
  status: "TRIAL" | "ACTIVE" | "EXPIRED";
  isAccessible: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  planName: string;
  price: string;
}

export function calculateSubscriptionStatus(user: {
  createdAt?: Date;
  trialEndsAt?: Date | null;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: Date | null;
}): UserSubscriptionInfo {
  const now = new Date();

  // 1. Active Paid Subscription check
  if (
    user.subscriptionStatus === "ACTIVE" &&
    user.subscriptionEndsAt &&
    new Date(user.subscriptionEndsAt) > now
  ) {
    return {
      status: "ACTIVE",
      isAccessible: true,
      trialDaysRemaining: 0,
      trialEndsAt: user.trialEndsAt ? new Date(user.trialEndsAt).toISOString() : null,
      subscriptionEndsAt: new Date(user.subscriptionEndsAt).toISOString(),
      planName: "PRO-TRADER Pro",
      price: "₹149/month",
    };
  }

  // 2. Free 7-Day Trial check
  const trialEnd = user.trialEndsAt
    ? new Date(user.trialEndsAt)
    : new Date((user.createdAt ? new Date(user.createdAt).getTime() : now.getTime()) + 7 * 24 * 60 * 60 * 1000);

  const diffMs = trialEnd.getTime() - now.getTime();
  const trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (diffMs > 0) {
    return {
      status: "TRIAL",
      isAccessible: true,
      trialDaysRemaining,
      trialEndsAt: trialEnd.toISOString(),
      subscriptionEndsAt: null,
      planName: "7-Day Free Trial",
      price: "₹0 (Free Trial)",
    };
  }

  // 3. Trial Expired
  return {
    status: "EXPIRED",
    isAccessible: false,
    trialDaysRemaining: 0,
    trialEndsAt: trialEnd.toISOString(),
    subscriptionEndsAt: null,
    planName: "Trial Expired",
    price: "₹149/month required",
  };
}
