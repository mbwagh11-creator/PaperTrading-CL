import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, USER_JWT_COOKIE, hashToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      // Delete session from DB
      await prisma.session.deleteMany({
        where: { tokenHash: hashToken(token) },
      }).catch(() => {});
    }

    // Delete both session and JWT cookies in cookieStore
    cookieStore.delete(SESSION_COOKIE);
    cookieStore.delete(USER_JWT_COOKIE);

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Explicitly expire both cookies in response headers for all browsers
    response.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );
    response.headers.append(
      "Set-Cookie",
      `${USER_JWT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Logout failed" }, { status: 500 });
  }
}
