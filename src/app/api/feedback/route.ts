import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function ensureFeedbackTableExist() {
  const query = `CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`;

  try {
    await prisma.$executeRawUnsafe(query);
  } catch (err) {
    console.error("Feedback DDL table check warning:", err);
  }
}

// GET /api/feedback -> Fetch latest community feedbacks
export async function GET(req: NextRequest) {
  try {
    await ensureFeedbackTableExist();

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (err: any) {
    console.error("Fetch feedback error:", err);
    return NextResponse.json({ success: false, feedbacks: [] }, { status: 500 });
  }
}

// POST /api/feedback -> Submit new user feedback
export async function POST(req: NextRequest) {
  try {
    await ensureFeedbackTableExist();

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const category = String(body.category || "General").trim();
    const rating = Math.min(5, Math.max(1, parseInt(body.rating || 5, 10)));
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    if (message.length < 5) {
      return NextResponse.json({ error: "Please enter a detailed feedback message (at least 5 characters)." }, { status: 400 });
    }

    // Optional: detect logged in user
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // optional
    }

    const created = await prisma.feedback.create({
      data: {
        userId,
        name,
        email,
        category,
        rating,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your feedback has been received.",
      feedback: created,
    });
  } catch (err: any) {
    console.error("Submit feedback error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit feedback." }, { status: 500 });
  }
}
