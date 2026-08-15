export interface UserSubscriptionInfo {
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "LIFETIME";
  isAccessible: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  planName: string;
  price: string;
}

const ADMIN_EMAILS = ["mbwagh11@gmail.com"];

export function calculateSubscriptionStatus(user: {
  email?: string | null;
  createdAt?: Date;
  trialEndsAt?: Date | null;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: Date | null;
}): UserSubscriptionInfo {
  const now = new Date();
  const userEmail = (user.email || "").toLowerCase().trim();

  // 1. Creator / Admin Lifetime Free Access
  if (
    ADMIN_EMAILS.includes(userEmail) ||
    user.subscriptionStatus === "LIFETIME" ||
    (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt).getFullYear() >= 2090)
  ) {
    return {
      status: "ACTIVE",
      isAccessible: true,
      trialDaysRemaining: 9999,
      trialEndsAt: null,
      subscriptionEndsAt: "2099-12-31T23:59:59.000Z",
      planName: "Lifetime Free Owner VIP",
      price: "₹0 (Lifetime Free)",
    };
  }

  // 2. Active Paid Subscription check
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

  // 3. Free 7-Day Trial check
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

  // 4. Trial Expired
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
