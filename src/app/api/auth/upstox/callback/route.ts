import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/upstox/callback - Upstox redirects here after login with ?code=...
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");

  const appUrl = new URL("/trades", req.nextUrl.origin);

  if (errorParam) {
    appUrl.searchParams.set("upstox_error", errorParam);
    return NextResponse.redirect(appUrl);
  }

  if (!code) {
    appUrl.searchParams.set("upstox_error", "missing_code");
    return NextResponse.redirect(appUrl);
  }

  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });

  const apiKey = process.env.UPSTOX_API_KEY || session?.apiKey;
  const apiSecret = process.env.UPSTOX_API_SECRET || session?.apiSecret;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/upstox/callback`;

  if (!apiKey || !apiSecret) {
    appUrl.searchParams.set("configure_upstox", "1");
    appUrl.searchParams.set("upstox_error", "missing_credentials");
    return NextResponse.redirect(appUrl);
  }

  try {
    const tokenRes = await fetch("https://api.upstox.com/v2/login/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: apiKey,
        client_secret: apiSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok || !data.access_token) {
      appUrl.searchParams.set("upstox_error", data.error_description || "token_exchange_failed");
      return NextResponse.redirect(appUrl);
    }

    await prisma.upstoxSession.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        accessToken: data.access_token,
        userName: data.user_name ?? null,
      },
      update: {
        accessToken: data.access_token,
        userName: data.user_name ?? null,
      },
    });

    appUrl.searchParams.set("upstox_connected", "1");
    return NextResponse.redirect(appUrl);
  } catch (err: any) {
    appUrl.searchParams.set("upstox_error", err.message);
    return NextResponse.redirect(appUrl);
  }
}
