import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const namePart = parts[0];
  const domainPart = parts[1];

  const maskedName =
    namePart.length <= 3
      ? namePart[0] + "***"
      : namePart[0] + "***" + namePart[namePart.length - 1];

  return `${maskedName}@${domainPart}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || "").trim().toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ error: "Please enter at least 2 characters to search." }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 5,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No account found matching that name or email. You can create a new account in 5 seconds." },
        { status: 404 }
      );
    }

    const matches = users.map((u) => ({
      name: u.name,
      maskedEmail: maskEmail(u.email),
      fullEmail: u.email,
    }));

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (err: any) {
    console.error("Find account error:", err);
    return NextResponse.json({ error: err.message || "Failed to search account" }, { status: 500 });
  }
}
