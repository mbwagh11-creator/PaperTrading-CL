import { prisma } from "@/lib/prisma";
import { computeAnalytics, livePnl } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import SEOFAQ from "@/components/SEOFAQ";

export const dynamic = "force-dynamic";

function Card({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const color = positive === undefined ? "text-white" : positive ? "text-accent" : "text-danger";
  return (
    <div className="bg-panel border border-border rounded-xl p-5">
      <p className="text-muted text-sm mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // -------------------------------------------------------------
  // SEO Landing Page for Unauthenticated Visitors & Search Engines
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="space-y-16 py-4">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Live NSE Market Quotes & Option Chain Simulator
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
            #1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">NSE Options & Stock</span> Paper Trading Platform
          </h1>

          <p className="text-slate-300 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
            Practice trading Indian stock market options with virtual money. Master Nifty 50, Nifty Bank, and stock option strategies risk-free using real-time quotes, automated P&L journal, and performance analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/pricing"
              className="w-full sm:w-auto bg-accent text-black font-extrabold text-base px-8 py-4 rounded-xl hover:brightness-105 transition-all shadow-[0_10px_35px_rgba(97,255,201,0.3)]"
            >
              Start 7-Day Free Trial (₹0)
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-base px-8 py-4 rounded-xl transition-all"
            >
              Trader Login
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-center border-t border-white/10">
            <div>
              <p className="text-2xl font-bold text-white">₹10,00,000</p>
              <p className="text-xs text-muted">Virtual Starting Capital</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">5 Seconds</p>
              <p className="text-xs text-muted">Live Market Quote Refresh</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Nifty & Bank Nifty</p>
              <p className="text-xs text-muted">Option Strike Chains</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">100% Risk-Free</p>
              <p className="text-xs text-muted">Virtual Derivatives Engine</p>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Why Top Indian Traders Choose PRO-TRADER
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Everything you need to test option buying, option selling, call/put spreads, and stock intraday strategies before committing capital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg">
                📈
              </div>
              <h3 className="text-lg font-bold text-white">Real-Time NSE Options Simulator</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test Call (CE) and Put (PE) option trades across Nifty 50, Bank Nifty, and top NSE stocks with live strike premium calculations.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg">
                📖
              </div>
              <h3 className="text-lg font-bold text-white">Automated Trade Journal</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Never lose track of your trades. Group your paper positions into monthly, yearly, and daily P&L calendar heatmaps with entry/exit tracking.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white">Live P&L Tracking & Analytics</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Watch open positions update in real time with 5-second auto-refresh. Analyze win rates, profit factor, average win/loss ratio, and drawdowns.
              </p>
            </div>
          </div>
        </section>

        {/* Upstox Integration Highlight */}
        <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              Optional Broker API Connection
            </span>
            <h3 className="text-2xl font-bold text-white">
              Connect Upstox for Live Market Ticks
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Integrate your Upstox API credentials directly into PRO-TRADER to fetch official live market quotes and execute virtual paper trades matched against exact market ticks.
            </p>
          </div>
          <Link
            href="/login"
            className="whitespace-nowrap bg-accent text-black font-bold text-sm px-6 py-3 rounded-xl hover:brightness-105 transition-all"
          >
            Create Free Account →
          </Link>
        </section>

        {/* Interactive SEO FAQ Section */}
        <SEOFAQ />

        {/* Bottom CTA Banner */}
        <section className="text-center rounded-3xl border border-white/10 bg-slate-900/80 p-8 space-y-4">
          <h3 className="text-2xl font-extrabold text-white">Ready to Master Options Trading Risk-Free?</h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            Join thousands of Indian options traders practicing on PRO-TRADER today.
          </p>
          <div className="pt-2">
            <Link
              href="/pricing"
              className="inline-block bg-accent text-black font-extrabold text-base px-8 py-3.5 rounded-xl hover:brightness-105 transition-all shadow-[0_10px_30px_rgba(97,255,201,0.25)]"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Trader Dashboard
  // -------------------------------------------------------------
  const [openTrades, closedTrades] = await Promise.all([
    prisma.trade.findMany({ where: { userId: user.id, status: "OPEN" }, orderBy: { createdAt: "desc" } }),
    prisma.trade.findMany({ where: { userId: user.id, status: "CLOSED" } }),
  ]);

  const analytics = computeAnalytics(closedTrades);
  const openUnrealized = openTrades.reduce((sum, t) => sum + livePnl(t), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Paper Trading Dashboard</h1>
        <p className="text-muted">Overview of your live position P&L and trading performance snapshot.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Open Positions" value={String(openTrades.length)} />
        <Card
          label="Unrealized P&L"
          value={`₹${openUnrealized.toFixed(2)}`}
          positive={openUnrealized >= 0}
        />
        <Card
          label="Realized P&L (closed)"
          value={`₹${analytics.totalPnl.toFixed(2)}`}
          positive={analytics.totalPnl >= 0}
        />
        <Card label="Win Rate" value={`${analytics.winRate}%`} />
      </div>

      {openTrades.length === 0 && closedTrades.length === 0 ? (
        <div className="bg-panel border border-border rounded-xl p-8 text-center">
          <p className="text-muted mb-4">You haven't placed any paper trades yet.</p>
          <Link
            href="/trades"
            className="inline-block bg-accent text-black font-medium px-5 py-2 rounded-lg hover:opacity-90"
          >
            Place your first trade
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-panel border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Open Positions</h2>
            {openTrades.length === 0 && <p className="text-muted text-sm">No open positions.</p>}
            <ul className="space-y-2">
              {openTrades.slice(0, 5).map((t) => {
                const pnl = livePnl(t);
                return (
                  <li key={t.id} className="flex justify-between text-sm border-b border-border pb-2">
                    <span>
                      {t.symbol} <span className="text-muted">({t.side} x{t.quantity})</span>
                    </span>
                    <span className={pnl >= 0 ? "text-accent" : "text-danger"}>₹{pnl.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-panel border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Performance Snapshot</h2>
            <ul className="text-sm space-y-2">
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Total closed trades</span>
                <span>{analytics.totalTrades}</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Wins / Losses</span>
                <span>
                  {analytics.wins} / {analytics.losses}
                </span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span className="text-muted">Avg win</span>
                <span className="text-accent">₹{analytics.avgWin.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Avg loss</span>
                <span className="text-danger">₹{analytics.avgLoss.toFixed(2)}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
