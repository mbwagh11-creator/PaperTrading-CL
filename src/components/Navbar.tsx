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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Status Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-1 font-extrabold text-xl whitespace-nowrap tracking-tight">
            <span className="text-accent font-black">PRO</span>
            <span className="text-white">-TRADER</span>
          </Link>

          {loggedIn && sub && (
            <Link
              href="/pricing"
              className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-all duration-200 ${
                sub.status === "ACTIVE" || sub.status === "LIFETIME"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                  : sub.status === "TRIAL"
                  ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
              }`}
            >
              {(sub.status === "ACTIVE" || sub.status === "LIFETIME") && "🟢 PRO Active"}
              {sub.status === "TRIAL" && `⚡ 7-Day Trial (${sub.trialDaysRemaining}d left)`}
              {sub.status === "EXPIRED" && "⚠️ Trial Expired (Subscribe ₹149)"}
            </Link>
          )}
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-300 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/trades"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Paper Trading
          </Link>
          <Link
            href="/journal"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Trade Journal
          </Link>
          <Link
            href="/analytics"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Analytics
          </Link>
          <Link
            href="/pricing"
            className="whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-accent hover:bg-accent/10 transition-all"
          >
            Pricing
          </Link>
          <Link
            href="/apps"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Apps 📱
          </Link>
          <Link
            href="/books"
            className="whitespace-nowrap rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white"
          >
            Books 📚
          </Link>

          {(user?.email === "mbwagh11@gmail.com" || sub?.status === "LIFETIME") && (
            <Link
              href="/admin"
              className="whitespace-nowrap rounded-full px-3 py-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold hover:bg-amber-400/25 transition-all"
            >
              👑 Admin
            </Link>
          )}
        </nav>

        {/* Right Side: Profile & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {loggedIn ? (
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                {user?.name || "Trader"}
              </span>
              <button
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 transition-all font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-slate-950 hover:brightness-105 transition-all shadow-[0_4px_14px_rgba(97,255,201,0.2)]"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
