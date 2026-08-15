"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
}

interface StatsData {
  totalUsers: number;
  activeProSubscribers: number;
  trialUsers: number;
  expiredUsers: number;
  totalTrades: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAdminStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admin stats");

      setStats(data.stats);
      setUsers(data.recentUsers || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold text-accent tracking-widest uppercase bg-accent/10 px-3 py-1 rounded-full border border-accent/30">
              👑 Owner Control Panel
            </span>
            <h1 className="mt-2 text-3xl font-extrabold">Subscriber & User Analytics</h1>
            <p className="text-sm text-slate-400">
              Live real-time monitoring of registered traders, active PRO subscribers, and platform usage.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAdminStats}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              🔄 Refresh Data
            </button>
            <Link
              href="/trades"
              className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors"
            >
              Trading Workspace →
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-6 text-center space-y-3">
            <p className="text-rose-300 font-semibold">{error}</p>
            <p className="text-xs text-slate-400">
              Please log in as Creator (<strong className="text-white">mbwagh11@gmail.com</strong>) to access owner analytics.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
            >
              Log In as Owner
            </Link>
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Fetching latest user counts and subscriber analytics...
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-1">
                <p className="text-xs text-slate-400 font-medium">Total Registered Users</p>
                <p className="text-3xl font-extrabold text-white">{stats?.totalUsers ?? 0}</p>
                <p className="text-[11px] text-emerald-400">👥 Total Trader Accounts</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-1">
                <p className="text-xs text-emerald-300 font-medium">Paid PRO Subscribers</p>
                <p className="text-3xl font-extrabold text-emerald-400">{stats?.activeProSubscribers ?? 0}</p>
                <p className="text-[11px] text-emerald-300">💎 ₹149/month PRO Members</p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-1">
                <p className="text-xs text-amber-300 font-medium">7-Day Free Trial Users</p>
                <p className="text-3xl font-extrabold text-amber-400">{stats?.trialUsers ?? 0}</p>
                <p className="text-[11px] text-amber-300">⚡ Active Trial Period</p>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-1">
                <p className="text-xs text-rose-300 font-medium">Expired Trial Accounts</p>
                <p className="text-3xl font-extrabold text-rose-400">{stats?.expiredUsers ?? 0}</p>
                <p className="text-[11px] text-rose-300">🎯 Conversion Opportunities</p>
              </div>
            </div>

            {/* Users Table */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Registered Users Directory</h2>
                <span className="text-xs text-slate-400">Showing latest {users.length} accounts</span>
              </div>

              {users.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No registered accounts found yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-3">Trader Name</th>
                        <th className="py-3 px-3">Email Address</th>
                        <th className="py-3 px-3">Joined Date</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                          <td className="py-3 px-3 text-slate-300 font-mono">{u.email}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                u.subscriptionStatus === "LIFETIME" || u.email === "mbwagh11@gmail.com"
                                  ? "bg-purple-400/20 text-purple-300 border border-purple-400/30"
                                  : u.subscriptionStatus === "ACTIVE"
                                  ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                                  : u.subscriptionStatus === "TRIAL"
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                  : "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                              }`}
                            >
                              {u.email === "mbwagh11@gmail.com"
                                ? "👑 OWNER VIP"
                                : u.subscriptionStatus === "LIFETIME"
                                ? "👑 LIFETIME PRO"
                                : u.subscriptionStatus === "ACTIVE"
                                ? "💎 PRO SUBSCRIBER"
                                : u.subscriptionStatus === "TRIAL"
                                ? "⚡ 7-DAY TRIAL"
                                : "🔴 EXPIRED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
