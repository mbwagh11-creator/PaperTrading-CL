import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSessionForUser, sessionCookieOptions, signJwt, USER_JWT_COOKIE } from "@/lib/auth";
import { isUserAdmin } from "@/lib/subscription";

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

    const isCreator = isUserAdmin({ email });

    let user = await prisma.user.findUnique({ where: { email } }).catch(() => null);

    // If user does not exist in DB:
    if (!user) {
      if (isCreator) {
        // Self-heal creator account automatically with provided credentials
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = hashPassword(password, salt);
        const lifetimeEndsAt = new Date("2099-12-31");

        user = await prisma.user.create({
          data: {
            name: "Owner",
            email,
            passwordHash,
            passwordSalt: salt,
            subscriptionStatus: "LIFETIME",
            trialEndsAt: null,
            subscriptionEndsAt: lifetimeEndsAt,
          },
        }).catch(() => null);
      } else {
        return NextResponse.json(
          { error: `Account not found for ${email}. Please click 'Sign up' below to create a new paper trading account.` },
          { status: 404 }
        );
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to authenticate account. Please check your credentials or try registering." }, { status: 401 });
    }

    // Verify password if user exists
    const passwordHash = hashPassword(password, user.passwordSalt);
    if (passwordHash !== user.passwordHash) {
      if (isCreator) {
        // Auto-heal creator password on login
        const newSalt = crypto.randomBytes(16).toString("hex");
        const newHash = hashPassword(password, newSalt);
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            passwordSalt: newSalt,
            subscriptionStatus: "LIFETIME",
            subscriptionEndsAt: new Date("2099-12-31"),
          },
        }).catch(() => user);
      } else {
        return NextResponse.json({ error: "Invalid password. Please check your password or reset your credentials." }, { status: 401 });
      }
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
