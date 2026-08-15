"use client";

import { FormEvent, useState } from "react";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = mode === "reset" ? "/api/auth/reset-password" : `/api/auth/${mode}`;
      const payload =
        mode === "reset"
          ? { email, newPassword: password }
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

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold">
        {mode === "login"
          ? "Trader Login"
          : mode === "signup"
          ? "Create Trader Account"
          : "Reset Password"}
      </h1>
      <p className="mb-5 text-sm text-slate-300">
        {mode === "reset"
          ? "Enter your email and new password to instantly recover and unlock your account."
          : "Login or sign up to access your personal NSE options paper-trading terminal & strategy journal."}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
            required
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email Address (e.g. mbwagh11@gmail.com)"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder={mode === "reset" ? "Enter New Password" : "Password"}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400"
          required
        />

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
            : "Reset Password & Login"}
        </button>
      </form>

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
              }}
              className="text-left text-xs text-slate-400 hover:text-white"
            >
              🔑 Forgot Password / Reset Credentials?
            </button>
          </>
        )}

        {mode === "signup" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className="text-left text-emerald-300 underline hover:text-emerald-200"
          >
            Already registered? Login
          </button>
        )}

        {mode === "reset" && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
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
