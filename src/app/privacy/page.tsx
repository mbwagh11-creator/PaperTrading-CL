import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Google Play Store Compliance | PRO-TRADER",
  description:
    "Privacy Policy and Data Safety disclosures for PRO-TRADER web and mobile applications.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | PRO-TRADER",
    description: "Privacy Policy and user data safety details for PRO-TRADER users.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="border-b border-white/10 pb-6 space-y-2">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest">
          Data Safety & Google Play Compliance
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-muted">
          Last Updated: August 13, 2026 • Applies to PRO-TRADER Web and Mobile Applications
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Overview</h2>
          <p>
            At <strong>PRO-TRADER</strong>, accessible from our website and Google Play Store mobile application, your privacy and data safety are of utmost importance. This Privacy Policy outlines the types of information we collect, how it is used, stored, protected, and how you can request full account and data deletion in accordance with Google Play Developer Policies.
          </p>
        </section>

        {/* Information Collected */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
          <p>We collect only minimal information necessary to deliver paper trading services:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
            <li>
              <strong>Account Data:</strong> Name, email address, and encrypted password credentials provided upon registration.
            </li>
            <li>
              <strong>Trading Activity:</strong> Virtual paper trade logs, order entries, position history, and custom trade journal notes.
            </li>
            <li>
              <strong>Technical & Device Data:</strong> IP address, browser type, operating system version, and app performance logs to diagnose technical errors.
            </li>
            <li>
              <strong>Payment Data:</strong> Subscription billing transactions processed securely via Razorpay. We do not store credit/debit card numbers or UPI PINs on our servers.
            </li>
          </ul>
        </section>

        {/* Use of Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. How We Use Your Information</h2>
          <p>Your data is used strictly for:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Providing and personalizing your paper-trading workspace and trade journal.</li>
            <li>Authenticating user logins and processing subscription status updates.</li>
            <li>Improving app performance, user experience, and resolving technical crashes.</li>
            <li>Communicating account notifications or customer support responses.</li>
          </ul>
        </section>

        {/* Sharing of Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Data Sharing & Third Parties</h2>
          <p>
            <strong>We never sell your personal data.</strong> Information is shared only with trusted service providers necessary for app operation:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li><strong>Razorpay:</strong> Payment processing for PRO subscription plans.</li>
            <li><strong>Upstox API (Optional):</strong> If connected by the user for fetching market quotes.</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Data Security & Storage</h2>
          <p>
            We implement industry-standard security measures, including HTTPS encryption, secure database hashing, and access controls to safeguard your personal information against unauthorized access or disclosure.
          </p>
        </section>

        {/* Account & Data Deletion - GOOGLE PLAY MANDATE */}
        <section className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
          <h2 className="text-lg font-bold text-accent">
            6. Account Deletion Request Policy (Google Play Mandate)
          </h2>
          <p>
            In compliance with Google Play Store User Data policies, users have the right to request the deletion of their PRO-TRADER account and associated data.
          </p>
          <div className="space-y-2 text-xs text-slate-200 pt-1">
            <p className="font-semibold text-white">How to request account and data deletion:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Send an email to <strong>privacy@protrader.app</strong> with the subject "Account Deletion Request".</li>
              <li>Include your registered PRO-TRADER account email address in the message body.</li>
              <li>Our team will process your request within 7 business days, permanently deleting your account credentials, virtual trade journal, and stored settings from our production database.</li>
            </ol>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Children's Privacy</h2>
          <p>
            PRO-TRADER does not knowingly collect personal information from children under the age of 13. If you believe your child has registered an account, please contact us immediately for removal.
          </p>
        </section>

        {/* Contact Information */}
        <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-bold text-white">8. Contact Privacy Team</h2>
          <p className="text-xs text-slate-300">
            For questions or concerns regarding this Privacy Policy, data privacy practices, or data deletion requests, contact us:
          </p>
          <p className="text-xs text-accent font-semibold">Email: privacy@protrader.app</p>
          <div className="pt-2 text-xs text-slate-400">
            Read our <Link href="/terms" className="text-accent underline">Terms & Conditions</Link> for complete usage rules and financial disclaimers.
          </div>
        </section>
      </div>
    </div>
  );
}
