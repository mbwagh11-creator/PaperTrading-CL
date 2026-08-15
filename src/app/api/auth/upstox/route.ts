import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/upstox - starts the Upstox login flow.
// Visiting this URL redirects the user directly to Upstox's login page.
export async function GET(req: NextRequest) {
  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });

  const apiKey = process.env.UPSTOX_API_KEY || session?.apiKey;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/upstox/callback`;

  if (!apiKey) {
    // If no API key configured yet, redirect to trades page with config modal trigger
    const configUrl = new URL("/trades", req.nextUrl.origin);
    configUrl.searchParams.set("configure_upstox", "1");
    return NextResponse.redirect(configUrl);
  }

  const authorizeUrl = new URL("https://api.upstox.com/v2/login/authorization/dialog");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", apiKey);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authorizeUrl.toString());
}
