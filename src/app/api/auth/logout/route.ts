import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, hashToken } from "@/lib/auth";

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

    // Clear session cookie
    cookieStore.delete(SESSION_COOKIE);

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Logout failed" }, { status: 500 });
  }
}
