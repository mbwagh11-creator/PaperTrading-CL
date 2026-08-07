import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "protrader_session";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}

export async function createSessionForUser(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function clearSessionCookie(response: Response) {
  const responseHeaders = response.headers;
  responseHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  return user;
}
