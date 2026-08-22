import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleteResult = await prisma.trade.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reset all trades. Cleared ${deleteResult.count} position(s).`,
      count: deleteResult.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to reset trades." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
