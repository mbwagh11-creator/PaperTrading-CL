import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Google Play Store Compliance | PRO-TRADER",
  description:
    "Terms of Service and Conditions for PRO-TRADER paper trading software and mobile application.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms & Conditions | PRO-TRADER",
    description: "Terms and Conditions of Use for PRO-TRADER NSE paper trading software.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="border-b border-white/10 pb-6 space-y-2">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">
          Legal & Google Play Compliance
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          Terms & Conditions of Service
        </h1>
        <p className="text-xs text-muted">
          Last Updated: August 13, 2026 • Applies to PRO-TRADER Web and Mobile Applications
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Agreement to Terms</h2>
          <p>
            Welcome to <strong>PRO-TRADER</strong> ("Application", "Platform", "We", "Us", or "Our"). By accessing or using our website, web application, or Google Play Store mobile application, you ("User" or "You") agree to be bound by these Terms & Conditions ("Terms"). If you do not agree with any part of these Terms, you must immediately discontinue use of the platform.
          </p>
        </section>

        {/* 2. Educational & Simulation Nature */}
        <section className="space-y-3 rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 text-rose-200">
          <h2 className="text-lg font-bold text-rose-400">
            2. Educational & Virtual Paper Trading Nature (Strictly Non-Advisory)
          </h2>
          <p>
            <strong>PRO-TRADER is a paper trading platform designed solely for educational purposes.</strong> We provide delayed market data, and no real-time trading is available. There are no investment-related activities or monetary benefits associated with this application. We do not offer investment advice or endorse any investment strategies.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-200 text-xs">
            <li>No real money or actual capital is traded, deposited, or risked on PRO-TRADER.</li>
            <li>Virtual P&L, account balances, and portfolio returns have zero real cash value and cannot be withdrawn or exchanged for legal tender.</li>
            <li>PRO-TRADER is <strong>NOT</strong> a SEBI-registered stockbroker, investment advisor, or portfolio manager. Nothing on this platform constitutes financial, investment, legal, or tax advice.</li>
            <li>If anyone contacts you claiming to provide investment services or advice under the PRO-TRADER name, please be aware that PRO-TRADER is not responsible for such activities and holds no liability for them. Report such incidents immediately to our support team.</li>
          </ul>
        </section>

        {/* 3. Account Registration & User Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. User Accounts & Registration</h2>
          <p>
            To use paper trading features, you must create a user account with a valid email address. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You agree to notify us immediately of any unauthorized account access.
          </p>
        </section>

        {/* 4. Subscriptions, Payments & Free Trial */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Subscriptions, Billing & Free Trial</h2>
          <p>
            PRO-TRADER offers a 7-day free trial followed by a paid subscription ("PRO Plan") billed at ₹149 per month via secure payment gateways (Razorpay).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Free Trial:</strong> New accounts receive full feature access for 7 days at ₹0 cost.</li>
            <li><strong>Subscription Billing:</strong> After the trial period, full feature access requires an active ₹149/month subscription.</li>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Your access will remain active until the end of your paid billing cycle.</li>
          </ul>
        </section>

        {/* 5. Third-Party Services & Market Data */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Third-Party Services & Delayed Market Data</h2>
          <p>
            Market data quotes and option chain feeds are aggregated from public sources and optional third-party APIs. PRO-TRADER is not affiliated with or endorsed by the National Stock Exchange of India (NSE). We provide delayed and simulated market data. We do not guarantee real-time latency or uninterrupted data availability.
          </p>
        </section>

        {/* 6. Acceptable Use Policy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Reverse engineer, decompile, or scrape the application's source code or market feed API.</li>
            <li>Use automated bots or scripts to place simulated trades or manipulate analytics data.</li>
            <li>Attempt to breach security measures or gain unauthorized access to other users' accounts.</li>
          </ul>
        </section>

        {/* 7. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Intellectual Property Rights</h2>
          <p>
            All content, graphics, source code, design systems, algorithms, trademarks, and logos contained within PRO-TRADER are the exclusive property of PRO-TRADER. Unauthorized reproduction or distribution is strictly prohibited.
          </p>
        </section>

        {/* 8. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, PRO-TRADER and its developers shall not be liable for any direct, indirect, incidental, consequential, or trading losses incurred by users in live markets as a result of using this simulation application.
          </p>
        </section>

        {/* 9. Modifications to Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Updated terms will be posted on this page with a revised "Last Updated" date. Your continued use of the platform following any modifications constitutes acceptance of the new terms.
          </p>
        </section>

        {/* 10. Contact Information */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-bold text-white">10. Contact Us</h2>
          <p className="text-xs text-slate-300">
            If you have questions regarding these Terms & Conditions or Google Play Store developer compliance, please reach out to our legal support team:
          </p>
          <p className="text-xs text-accent font-semibold">Email: support@protrader.app</p>
          <div className="pt-2 text-xs text-slate-400">
            Read our <Link href="/privacy" className="text-accent underline">Privacy Policy</Link> for details on data protection and account deletion policies.
          </div>
        </section>
      </div>
    </div>
  );
}
