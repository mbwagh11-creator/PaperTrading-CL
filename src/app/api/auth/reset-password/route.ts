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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(newPassword, salt);

    const updatedUser = await prisma.user.update({
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

    const { token, expiresAt } = await createSessionForUser(updatedUser.id);
    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully! Logging you in...",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
    response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Failed to reset password" }, { status: 500 });
  }
}
