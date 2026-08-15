"use client";

import { FormEvent, useState } from "react";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "find">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Array<{ name: string; maskedEmail: string; fullEmail: string }>>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
        setMessage(`Found ${data.matches.length} matching account(s). Click any account below to autofill and reset password.`);
        return;
      }

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

  function selectFoundAccount(accEmail: string) {
    setEmail(accEmail);
    setMode("reset");
    setMessage(`Selected ${accEmail}. Type your new password below to reset and log in.`);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold">
        {mode === "login"
          ? "Trader Login"
          : mode === "signup"
          ? "Create Trader Account"
          : mode === "reset"
          ? "Reset Password"
          : "Find My Account"}
      </h1>
      <p className="mb-5 text-sm text-slate-300">
        {mode === "find"
          ? "Type your name to search for your registered email address."
          : mode === "reset"
          ? "Enter your email and new password to instantly recover and unlock your account."
          : "Login or sign up to access your personal NSE options paper-trading terminal & strategy journal."}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === "find" && (
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Your Name (e.g. Manoj)"
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
                <span className="text-emerald-300 font-semibold">Select & Reset →</span>
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
