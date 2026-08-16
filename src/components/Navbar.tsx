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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Sub Status Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/" className="flex items-center gap-1 font-extrabold text-xl whitespace-nowrap tracking-tight">
            <span className="text-accent font-black">PRO</span>
            <span className="text-white">-TRADER</span>
          </Link>

          {loggedIn && sub && (
            <Link
              href="/pricing"
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                sub.status === "ACTIVE" || sub.status === "LIFETIME"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : sub.status === "TRIAL"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {(sub.status === "ACTIVE" || sub.status === "LIFETIME") && "🟢 PRO Active"}
              {sub.status === "TRIAL" && `⚡ 7-Day Trial (${sub.trialDaysRemaining}d left)`}
              {sub.status === "EXPIRED" && "⚠️ Trial Expired"}
            </Link>
          )}
        </div>

        {/* Desktop Navigation Links (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-slate-300">
          <Link href="/" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Dashboard
          </Link>
          <Link href="/trades" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Paper Trading
          </Link>
          <Link href="/journal" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Trade Journal
          </Link>
          <Link href="/analytics" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Analytics
          </Link>
          <Link href="/pricing" className="rounded-full px-3 py-1.5 font-semibold text-accent hover:bg-accent/10 transition-all">
            Pricing
          </Link>
          <Link href="/apps" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Apps
          </Link>
          <Link href="/books" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Books
          </Link>
          <Link href="/feedback" className="rounded-full px-3 py-1.5 transition-all hover:bg-white/10 hover:text-white">
            Feedback
          </Link>

          {(user?.email === "mbwagh11@gmail.com" || sub?.status === "LIFETIME") && (
            <Link
              href="/admin"
              className="rounded-full px-3 py-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold hover:bg-amber-400/25 transition-all"
            >
              👑 Admin
            </Link>
          )}
        </nav>

        {/* Right Side: Desktop Profile & Mobile Hamburger Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop User Info & Logout */}
          <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-3">
            {loggedIn ? (
              <>
                <span className="text-xs font-semibold text-slate-200 max-w-[110px] truncate">
                  {user?.name || "Trader"}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 transition-all font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-slate-950 hover:brightness-105 transition-all shadow-[0_4px_14px_rgba(97,255,201,0.2)]"
              >
                Login / Signup
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl bg-white/5 border border-white/10 p-2 text-slate-200 hover:bg-white/10 transition-all text-base"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950 px-4 pt-3 pb-6 space-y-2 text-sm shadow-2xl animate-in slide-in-from-top-2">
          {loggedIn && (
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <span className="text-slate-300 font-semibold">👤 {user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold"
              >
                Logout
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/trades"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              📈 Paper Trading
            </Link>
            <Link
              href="/journal"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              📔 Trade Journal
            </Link>
            <Link
              href="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              📉 Analytics
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-accent/10 border border-accent/30 text-accent p-3 rounded-xl flex items-center gap-2 font-bold"
            >
              ⚡ Pricing Plans
            </Link>
            <Link
              href="/apps"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              Mobile Apps
            </Link>
            <Link
              href="/books"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              E-Books
            </Link>
            <Link
              href="/feedback"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white/5 hover:bg-white/10 text-slate-200 p-3 rounded-xl flex items-center gap-2 border border-white/5 font-medium"
            >
              Feedback
            </Link>
            {(user?.email === "mbwagh11@gmail.com" || sub?.status === "LIFETIME") && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-amber-400/15 border border-amber-400/30 text-amber-300 p-3 rounded-xl flex items-center gap-2 font-bold"
              >
                👑 Owner Admin
              </Link>
            )}
          </div>

          {!loggedIn && (
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-accent text-slate-950 font-bold p-3 rounded-xl shadow-lg"
              >
                Trader Login / Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
