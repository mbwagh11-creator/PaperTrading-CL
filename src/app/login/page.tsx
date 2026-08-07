"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
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
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      setMessage(mode === "login" ? "Login successful. You can now use paper trading." : "Account created. You can login now.");
      if (mode === "login") {
        window.location.href = "/trades";
      } else {
        setMode("login");
        setName("");
        setPassword("");
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-bold">{mode === "login" ? "Login" : "Create account"}</h1>
      <p className="mb-5 text-sm text-slate-300">
        Each user will get their own paper-trading workspace after login.
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-400 px-3 py-2 font-semibold text-slate-950"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-3 text-sm text-emerald-300 underline"
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
      </button>

      {message && <p className="mt-4 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
