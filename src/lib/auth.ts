import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "protrader_session";
export const USER_JWT_COOKIE = "protrader_user_jwt";

const JWT_SECRET = process.env.JWT_SECRET || "protrader-paper-trading-secret-key-2026";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function signJwt(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

export function verifyJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const jwtToken = cookieStore.get(USER_JWT_COOKIE)?.value;

  // 1. Try JWT Token First (Stateless Serverless Resilience)
  if (jwtToken) {
    const jwtPayload = verifyJwt(jwtToken);
    if (jwtPayload && jwtPayload.userId) {
      // Find or self-heal user in DB
      let user = await prisma.user.findUnique({ where: { id: jwtPayload.userId } }).catch(() => null);
      if (!user && jwtPayload.email) {
        user = await prisma.user.findUnique({ where: { email: jwtPayload.email } }).catch(() => null);
      }
      if (!user && jwtPayload.email) {
        // Self-heal user record in current serverless container DB
        const isCreator = Boolean(process.env.ADMIN_EMAIL && jwtPayload.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
        user = await prisma.user.create({
          data: {
            id: jwtPayload.userId,
            name: jwtPayload.name || "Trader",
            email: jwtPayload.email,
            passwordHash: jwtPayload.passwordHash || "hash",
            passwordSalt: jwtPayload.passwordSalt || "salt",
            subscriptionStatus: isCreator ? "LIFETIME" : "TRIAL",
            trialEndsAt: isCreator ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            subscriptionEndsAt: isCreator ? new Date("2099-12-31") : null,
          },
        }).catch(() => null);
      }
      if (user) return user;
    }
  }

  // 2. Fallback to Session DB lookups
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  }).catch(() => null);

  return session?.user ?? null;
}

export async function createSessionForUser(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 Days

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  }).catch(() => null);

  return { token, expiresAt };
}

export async function clearSessionCookie(response: Response) {
  const responseHeaders = response.headers;
  responseHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  responseHeaders.append(
    "Set-Cookie",
    `${USER_JWT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
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
