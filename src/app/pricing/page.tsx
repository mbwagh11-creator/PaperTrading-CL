import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing & 7-Day Free Trial | ₹149/mo PRO-TRADER Subscription",
  description:
    "Try PRO-TRADER free for 7 days. Full access to NSE stock and options paper trading, real-time Nifty quotes, option chain simulator, trade journal, and performance analytics for ₹149/month.",
  keywords: [
    "NSE paper trading pricing",
    "Options trading simulator free trial",
    "Paper trading subscription India",
    "NSE trade journal pricing",
    "Nifty paper trading cost",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "PRO-TRADER Pricing | 7 Days Free Trial, Then ₹149/Month",
    description:
      "Practice NSE stock & options paper trading risk-free. Get full feature access with 7 days free trial, then ₹149/month. Cancel anytime.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
