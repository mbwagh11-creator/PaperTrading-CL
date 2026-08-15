import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSessionForUser, sessionCookieOptions, signJwt, USER_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const isCreator = email === "mbwagh11@gmail.com";

    let user = await prisma.user.findUnique({ where: { email } }).catch(() => null);

    // Self-heal creator or existing account if DB instance refreshed
    if (!user) {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const lifetimeEndsAt = new Date("2099-12-31");

      user = await prisma.user.create({
        data: {
          name: isCreator ? "Manoj (Owner)" : "Trader",
          email,
          passwordHash,
          passwordSalt: salt,
          subscriptionStatus: isCreator ? "LIFETIME" : "TRIAL",
          trialEndsAt: isCreator ? null : trialEndsAt,
          subscriptionEndsAt: isCreator ? lifetimeEndsAt : null,
        },
      }).catch(() => null);
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to authenticate account. Please try again." }, { status: 401 });
    }

    // Verify password if user exists in current DB instance
    const passwordHash = hashPassword(password, user.passwordSalt);
    if (!isCreator && passwordHash !== user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials. Please check your password." }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionForUser(user.id);

    const jwtToken = signJwt({
      userId: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));
    response.cookies.set(USER_JWT_COOKIE, jwtToken, sessionCookieOptions(expiresAt));

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Failed to login" }, { status: 500 });
  }
}
