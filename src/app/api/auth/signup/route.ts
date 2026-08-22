import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSessionForUser, sessionCookieOptions, signJwt, USER_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

async function ensureTablesExist() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "passwordSalt" TEXT NOT NULL,
      "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
      "trialEndsAt" TIMESTAMP(3),
      "subscriptionEndsAt" TIMESTAMP(3),
      "paymentId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Trade" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "symbol" TEXT NOT NULL,
      "instrumentKey" TEXT,
      "side" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "entryPrice" DOUBLE PRECISION NOT NULL,
      "exitPrice" DOUBLE PRECISION,
      "stopLoss" DOUBLE PRECISION,
      "target" DOUBLE PRECISION,
      "currentPrice" DOUBLE PRECISION,
      "pnl" DOUBLE PRECISION,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "closedAt" TIMESTAMP(3)
    );`,
    `CREATE TABLE IF NOT EXISTS "Instrument" (
      "id" TEXT PRIMARY KEY,
      "instrumentKey" TEXT UNIQUE NOT NULL,
      "exchange" TEXT NOT NULL,
      "tradingSymbol" TEXT NOT NULL,
      "name" TEXT,
      "instrumentType" TEXT,
      "strikePrice" DOUBLE PRECISION,
      "expiry" TEXT,
      "lotSize" INTEGER,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
    } catch (err) {
      console.error("DDL table creation step warning:", err);
    }
  }
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

    // Auto-create PostgreSQL tables on Supabase if not present
    await ensureTablesExist();

    const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    const isCreator = Boolean(process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const lifetimeEndsAt = new Date("2099-12-31");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        passwordSalt: salt,
        subscriptionStatus: isCreator ? "LIFETIME" : "TRIAL",
        trialEndsAt: isCreator ? null : trialEndsAt,
        subscriptionEndsAt: isCreator ? lifetimeEndsAt : null,
      },
    });

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
    response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));
    response.cookies.set(USER_JWT_COOKIE, jwtToken, sessionCookieOptions(expiresAt));

    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    if (err.message && (err.message.includes("localhost:5432") || err.message.includes("Can't reach database"))) {
      return NextResponse.json(
        {
          error:
            "Database Connection Error: Please verify that DATABASE_URL is added to Vercel Environment Variables with Production environment checked.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: err.message || "Failed to create account" }, { status: 500 });
  }
}
