"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SubStatus {
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "LIFETIME" | string;
  trialDaysRemaining: number;
  planName: string;
}

export default function Navbar() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  async function checkStatus() {
    try {
      const res = await fetch("/api/subscription/status", { cache: "no-store" });
      const data = await res.json();
      if (data.loggedIn) {
        setLoggedIn(true);
        setUser(data.user);
        setSub(data.subscription);
      } else {
        setLoggedIn(false);
      }
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "protrader_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "protrader_user_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      setLoggedIn(false);
      setUser(null);
      setSub(null);
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-lg">
            <span className="text-accent font-extrabold text-xl">PRO</span>
            <span className="text-white">-TRADER</span>
          </Link>

          {loggedIn && sub && (
            <Link
              href="/pricing"
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 ${
                sub.status === "ACTIVE"
                  ? "bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30"
                  : sub.status === "TRIAL"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30"
              }`}
            >
              {sub.status === "ACTIVE" && "🟢 PRO Active"}
              {sub.status === "TRIAL" && `⚡ 7-Day Trial (${sub.trialDaysRemaining}d left)`}
              {sub.status === "EXPIRED" && "⚠️ Trial Expired (Subscribe ₹149)"}
            </Link>
          )}
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-300 sm:gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/trades"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            Paper Trading
          </Link>
          <Link
            href="/journal"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            Trade Journal
          </Link>
          <Link
            href="/analytics"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            Analytics
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 transition-all duration-200 text-accent font-medium hover:bg-accent/10"
          >
            Pricing
          </Link>
          <Link
            href="/apps"
            className="rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            Apps 📱
          </Link>
          <Link
            href="/books"
            className="rounded-full px-3 py-1.5 transition-all duration-200 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium hover:bg-emerald-500/20"
          >
            E-Books 📚
          </Link>

          {(user?.email === "mbwagh11@gmail.com" || sub?.status === "LIFETIME") && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 transition-all duration-200 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold hover:bg-amber-400/30"
            >
              👑 Admin
            </Link>
          )}

          {loggedIn ? (
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-xs font-medium text-slate-200">
                {user?.name || "Trader"}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-danger/20 hover:text-danger border border-white/10 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-black hover:brightness-95 transition-all shadow-[0_4px_14px_rgba(97,255,201,0.2)]"
            >
              Login / Signup
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
