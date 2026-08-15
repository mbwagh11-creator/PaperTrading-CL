import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSessionForUser, sessionCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    // Set 7 days free trial
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        passwordSalt: salt,
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      },
    });

    const { token, expiresAt } = await createSessionForUser(user.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        trialEndsAt: trialEndsAt.toISOString(),
        subscriptionStatus: "TRIAL",
      },
    });
    response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));

    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 });
  }
}
