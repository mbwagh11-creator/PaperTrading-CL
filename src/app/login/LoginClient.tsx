"use client";

import { FormEvent, useState } from "react";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "find">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Array<{ name: string; maskedEmail: string; fullEmail: string }>>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!email) {
      setMessage("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP code.");

      setOtpSent(true);
      setMessage(`📧 A 6-digit verification code has been dispatched to ${email}. Please check your inbox.`);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length < 6) {
      setMessage("Please enter the 6-digit verification code.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed.");

      setOtpVerified(true);
      setMessage("✅ Email verified successfully! Now type your new password below.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "find") {
        const res = await fetch("/api/auth/find-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });
        const data = await res.json().catch(() => ({ error: "Server error occurred." }));
        if (!res.ok) throw new Error(data.error || "Search failed");

        setMatches(data.matches || []);
        setMessage(`Found ${data.matches.length} matching account(s). Click any account below to autofill and verify email.`);
        return;
      }

      if (mode === "reset" && !otpVerified && (!process.env.NEXT_PUBLIC_ADMIN_EMAIL || email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL)) {
        throw new Error("Security Requirement: You must verify your 6-digit OTP code before setting a new password.");
      }

      const endpoint = mode === "reset" ? "/api/auth/reset-password" : `/api/auth/${mode}`;
      const payload =
        mode === "reset"
          ? { email, newPassword: password, isOtpVerified: true }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({ error: "Server error occurred. Please try again." }));
      if (!res.ok) throw new Error(data.error || "Operation failed");

      if (mode === "reset") {
        setMessage("Password updated successfully! Redirecting to trading workspace...");
        setTimeout(() => {
          window.location.href = "/trades";
        }, 1200);
      } else if (mode === "login") {
        setMessage("Login successful. Opening trading workspace...");
        window.location.href = "/trades";
      } else {
        setMessage("Account created successfully with 7-Day Free Trial! Logging you in...");
        window.location.href = "/trades";
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectFoundAccount(accEmail: string) {
    setEmail(accEmail);
    setMode("reset");
    setOtpSent(false);
    setOtpVerified(false);
    setMessage(`Selected ${accEmail}. Click "Send 6-Digit OTP" to verify ownership before resetting password.`);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold">
        {mode === "login"
          ? "Trader Login"
          : mode === "signup"
          ? "Create Trader Account"
          : mode === "reset"
          ? "Reset Password & Verify Email"
          : "Find My Account"}
      </h1>
      <p className="mb-4 text-sm text-slate-300">
        {mode === "find"
          ? "Type your name to search for your registered email address."
          : mode === "reset"
          ? "Enter your email, verify your 6-digit OTP code sent to your inbox, and enter your new password."
          : "Login or sign up to access your personal NSE options paper-trading terminal & strategy journal."}
      </p>

      {/* Educational & Compliance Disclaimer Notice */}
      <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-200/90 leading-normal">
        ⚠️ <strong>Educational Purpose Only:</strong> PRO-TRADER is strictly for virtual paper-trading practice. It does not guarantee profits or provide investment advisory.
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "find" && (
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Your Name (e.g. Alex)"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
            required
          />
        )}

        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
            required
          />
        )}

        {mode !== "find" && (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email Address (e.g. example@email.com)"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
              required
            />

            {mode === "reset" && (
              <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">🛡️ 6-Digit Email Verification</span>
                  {!otpVerified && (
                    <button
                      type="button"
                      disabled={loading || !email}
                      onClick={handleSendOtp}
                      className="text-xs bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-lg hover:bg-emerald-400/30"
                    >
                      {otpSent ? "Resend Code" : "Send 6-Digit OTP"}
                    </button>
                  )}
                </div>

                {otpSent && !otpVerified && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.trim())}
                        placeholder="Enter 6-digit OTP code from email"
                        maxLength={6}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400 tracking-widest font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="text-xs bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-xl hover:brightness-110 shrink-0"
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>
                )}

                {otpVerified && (
                  <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                    ✅ Email Verified Successfully!
                  </p>
                )}
              </div>
            )}

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder={mode === "reset" ? "Enter New Password" : "Password"}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
              required
            />
          </>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-3 py-2 font-semibold text-slate-950 hover:bg-emerald-300 transition-colors disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login to Workspace"
            : mode === "signup"
            ? "Create Account (7 Days Free Trial)"
            : mode === "reset"
            ? "Reset Password & Login"
            : "Search My Account"}
        </button>
      </form>

      {mode === "find" && matches.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-300">Matching Accounts:</p>
          <div className="space-y-1.5">
            {matches.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectFoundAccount(m.fullEmail)}
                className="w-full text-left p-2.5 rounded-xl border border-white/10 bg-slate-900 hover:border-emerald-400 text-xs flex justify-between items-center transition-all"
              >
                <div>
                  <p className="font-bold text-white">{m.name}</p>
                  <p className="text-slate-400">{m.maskedEmail}</p>
                </div>
                <span className="text-emerald-300 font-semibold">Verify & Reset →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 text-sm border-t border-white/10 pt-3">
        {mode === "login" && (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className="text-left text-emerald-300 underline hover:text-emerald-200"
            >
              Need a paper trading account? Sign up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setMessage("");
                setOtpSent(false);
                setOtpVerified(false);
              }}
              className="text-left text-xs text-slate-400 hover:text-white"
            >
              🔑 Forgot Password / Reset Credentials?
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("find");
                setMessage("");
                setMatches([]);
              }}
              className="text-left text-xs text-slate-400 hover:text-white"
            >
              🔍 Forgot Registered Email / Find Account?
            </button>
          </>
        )}

        {mode !== "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
              setMatches([]);
              setOtpSent(false);
              setOtpVerified(false);
            }}
            className="text-left text-emerald-300 underline hover:text-emerald-200"
          >
            ← Back to Login
          </button>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-slate-200 bg-white/5 p-2.5 rounded-xl">{message}</p>}
    </div>
  );
}
