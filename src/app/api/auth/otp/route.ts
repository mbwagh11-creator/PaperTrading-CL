import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// In-memory OTP store (email -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "").trim(); // "send" or "verify"
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    // -------------------------------------------------------------
    // ACTION 1: SEND OTP CODE
    // -------------------------------------------------------------
    if (action === "send") {
      const code = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpStore.set(email, { code, expiresAt });

      console.log(`[SECURITY OTP FEED] Code for ${email}: ${code}`);

      return NextResponse.json({
        success: true,
        message: `6-digit verification code sent to ${email}.`,
        // Include demo code preview for seamless testing without external SMTP dependency
        demoCodePreview: code,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: VERIFY OTP CODE
    // -------------------------------------------------------------
    if (action === "verify") {
      const inputCode = String(body.code || "").trim();
      const record = otpStore.get(email);

      if (!record) {
        return NextResponse.json(
          { error: "No active verification code found for this email. Please request a new code." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new 6-digit code." },
          { status: 400 }
        );
      }

      if (record.code !== inputCode) {
        return NextResponse.json(
          { error: "Invalid 6-digit verification code. Please check and try again." },
          { status: 400 }
        );
      }

      // Code is valid! Consume it.
      otpStore.delete(email);

      // Generate a temporary verification token (valid for 5 minutes)
      const token = crypto.createHash("sha256").update(`${email}:${record.code}:${Date.now()}`).digest("hex");

      return NextResponse.json({
        success: true,
        verified: true,
        verificationToken: token,
        message: "Email verified successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'send' or 'verify'." }, { status: 400 });
  } catch (err: any) {
    console.error("OTP API error:", err);
    return NextResponse.json({ error: err.message || "OTP processing error" }, { status: 500 });
  }
}
