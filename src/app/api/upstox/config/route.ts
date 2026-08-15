import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await prisma.upstoxSession.findUnique({ where: { id: "singleton" } });
  
  const envApiKey = process.env.UPSTOX_API_KEY;
  const envApiSecret = process.env.UPSTOX_API_SECRET;

  const apiKey = envApiKey || session?.apiKey || "";
  const apiSecret = envApiSecret || session?.apiSecret || "";
  const redirectUri = process.env.UPSTOX_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/upstox/callback`;

  return NextResponse.json({
    hasKeys: Boolean(apiKey && apiSecret),
    apiKey,
    redirectUri,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, apiSecret } = await req.json();

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "API Key and API Secret are required" }, { status: 400 });
    }

    await prisma.upstoxSession.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      },
      update: {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
