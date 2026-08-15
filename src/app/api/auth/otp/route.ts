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
    // ACTION 1: SEND SECURE OTP TO EMAIL
    // -------------------------------------------------------------
    if (action === "send") {
      const code = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      otpStore.set(email, { code, expiresAt });

      console.log(`[SECURE EMAIL DISPATCH] 6-Digit OTP for ${email}: ${code}`);

      // Optional Resend HTTP dispatch if RESEND_API_KEY is configured
      if (process.env.RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "PRO-TRADER Security <security@pro-trader.in>",
              to: email,
              subject: `${code} is your PRO-TRADER Password Reset Code`,
              html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;border-radius:12px;">
                <h2>PRO-TRADER Account Security</h2>
                <p>Your 6-digit password verification code is:</p>
                <h1 style="font-size:36px;letter-spacing:6px;color:#34d399;">${code}</h1>
                <p style="color:#94a3b8;font-size:12px;">This code will expire in 10 minutes. If you did not request this, please ignore.</p>
              </div>`,
            }),
          });
        } catch (err) {
          console.error("Resend API dispatch error:", err);
        }
      }

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${email}. Check your inbox/spam folder.`,
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
          { error: "No active verification code found for this email. Please click 'Send 6-Digit OTP'." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (record.code !== inputCode) {
        return NextResponse.json(
          { error: "Invalid 6-digit verification code. Please check your inbox and try again." },
          { status: 400 }
        );
      }

      // Code is valid! Consume it.
      otpStore.delete(email);

      const token = crypto.createHash("sha256").update(`${email}:${record.code}:${Date.now()}`).digest("hex");

      return NextResponse.json({
        success: true,
        verified: true,
        verificationToken: token,
        message: "Email verified successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("OTP API error:", err);
    return NextResponse.json({ error: err.message || "OTP processing error" }, { status: 500 });
  }
}
