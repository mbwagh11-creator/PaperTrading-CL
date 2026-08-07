import { prisma } from "@/lib/prisma";
import { computeAnalytics, livePnl } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

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
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        Please login to access your personal paper-trading dashboard.
      </div>
    );
  }

  const [openTrades, closedTrades] = await Promise.all([
    prisma.trade.findMany({ where: { userId: user.id, status: "OPEN" }, orderBy: { createdAt: "desc" } }),
    prisma.trade.findMany({ where: { userId: user.id, status: "CLOSED" } }),
  ]);

  const analytics = computeAnalytics(closedTrades);
  const openUnrealized = openTrades.reduce((sum, t) => sum + livePnl(t), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted">Overview of your paper trading performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Open Trades" value={String(openTrades.length)} />
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
