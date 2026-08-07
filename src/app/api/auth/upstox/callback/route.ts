import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/upstox/callback - Upstox redirects here after login with ?code=...
// We exchange that single-use code for an access_token and store it.
// Note: Upstox access tokens expire every day at 3:30 AM IST, so you'll need
// to click "Connect Upstox" again each trading day.
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

  const apiKey = process.env.UPSTOX_API_KEY;
  const apiSecret = process.env.UPSTOX_API_SECRET;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  if (!apiKey || !apiSecret || !redirectUri) {
    appUrl.searchParams.set("upstox_error", "missing_env_vars");
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
      create: { id: "singleton", accessToken: data.access_token, userName: data.user_name ?? null },
      update: { accessToken: data.access_token, userName: data.user_name ?? null },
    });

    appUrl.searchParams.set("upstox_connected", "1");
    return NextResponse.redirect(appUrl);
  } catch (err: any) {
    appUrl.searchParams.set("upstox_error", err.message);
    return NextResponse.redirect(appUrl);
  }
}
