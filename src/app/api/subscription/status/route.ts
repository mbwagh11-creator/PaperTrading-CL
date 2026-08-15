import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { calculateSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ loggedIn: false, subscription: null });
  }

  const subscription = calculateSubscriptionStatus(user);

  return NextResponse.json({
    loggedIn: true,
    user: { id: user.id, name: user.name, email: user.email },
    subscription,
  });
}
