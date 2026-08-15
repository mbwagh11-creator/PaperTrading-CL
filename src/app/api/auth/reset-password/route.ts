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
    const newPassword = String(body.newPassword || "");
    const isOtpVerified = Boolean(body.isOtpVerified);

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long." }, { status: 400 });
    }

    const isCreator = email === "mbwagh11@gmail.com";

    // SECURITY CHECK: Require OTP verification unless creator master access
    if (!isOtpVerified && !isCreator) {
      return NextResponse.json(
        { error: "Security Check: 6-digit OTP verification is required to reset password for this account." },
        { status: 403 }
      );
    }

    let user = await prisma.user.findUnique({ where: { email } }).catch(() => null);

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(newPassword, salt);

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: isCreator ? "Manoj (Owner)" : "Trader",
          email,
          passwordHash,
          passwordSalt: salt,
          subscriptionStatus: isCreator ? "LIFETIME" : "TRIAL",
          trialEndsAt: isCreator ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          subscriptionEndsAt: isCreator ? new Date("2099-12-31") : null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordSalt: salt,
          ...(isCreator
            ? {
                subscriptionStatus: "LIFETIME",
                subscriptionEndsAt: new Date("2099-12-31"),
              }
            : {}),
        },
      });
    }

    const { token, expiresAt } = await createSessionForUser(user.id);

    const jwtToken = signJwt({
      userId: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    });

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully! Logging you in...",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
    response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));
    response.cookies.set(USER_JWT_COOKIE, jwtToken, sessionCookieOptions(expiresAt));

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Failed to reset password" }, { status: 500 });
  }
}
