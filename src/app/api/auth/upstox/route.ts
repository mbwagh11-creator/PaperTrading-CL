import { NextResponse } from "next/server";

// GET /api/auth/upstox - starts the Upstox login flow.
// Visiting this URL redirects the user to Upstox's own login page.
export async function GET() {
  const apiKey = process.env.UPSTOX_API_KEY;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  if (!apiKey || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "UPSTOX_API_KEY and UPSTOX_REDIRECT_URI must be set in .env first. See README Phase 2 section.",
      },
      { status: 400 }
    );
  }

  const authorizeUrl = new URL("https://api.upstox.com/v2/login/authorization/dialog");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", apiKey);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authorizeUrl.toString());
}
