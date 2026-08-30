import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateSubscriptionStatus, isUserAdmin } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ loggedIn: false, subscription: null, user: null });
  }

  const subscription = calculateSubscriptionStatus(user);
  const isAdmin = isUserAdmin(user);

  return NextResponse.json({
    loggedIn: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      isAdmin,
    },
    subscription: {
      ...subscription,
      isAdmin,
    },
  });
}
