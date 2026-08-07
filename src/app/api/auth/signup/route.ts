import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createSessionForUser, sessionCookieOptions } from "@/lib/auth";

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      passwordSalt: salt,
    },
  });

  const { token, expiresAt } = await createSessionForUser(user.id);
  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
  response.cookies.set("protrader_session", token, sessionCookieOptions(expiresAt));

  return response;
}
