import AppDownloadBanner from "./AppDownloadBanner";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950/80 pt-12 pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Mobile App Download Banner */}
        <AppDownloadBanner />

        {/* Footer Navigation & Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-slate-400">
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-lg text-white">
              <span className="text-accent font-extrabold text-xl">PRO</span>-TRADER
            </Link>
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              NSE options paper trading, real-time quotes, strategy journal & performance analytics. Practice derivatives trading risk-free.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-accent transition-colors">Dashboard</Link></li>
              <li><Link href="/trades" className="hover:text-accent transition-colors">Paper Trading</Link></li>
              <li><Link href="/journal" className="hover:text-accent transition-colors">Trade Journal</Link></li>
              <li><Link href="/analytics" className="hover:text-accent transition-colors">Performance Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/pricing" className="hover:text-accent transition-colors">Subscription Pricing</Link></li>
              <li><Link href="/apps" className="hover:text-accent transition-colors">Mobile Apps (Direct Download)</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Trader Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
          <p>© {new Date().getFullYear()} PRO-TRADER. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
