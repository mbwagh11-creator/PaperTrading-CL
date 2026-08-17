import type { Metadata } from "next";
import TradesClient from "./TradesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NSE Options Paper Trading Terminal | Nifty & Bank Nifty Simulator",
  description:
    "Place virtual paper trades on NSE Call & Put options, stocks, and index derivatives. Track simulated P&L with automated market quote updates.",
  keywords: [
    "NSE options paper trading terminal",
    "Nifty 50 option calculator",
    "Bank Nifty paper trade order",
    "Call Put options simulator",
    "NSE virtual order book",
  ],
  alternates: {
    canonical: "/trades",
  },
  openGraph: {
    title: "NSE Options Paper Trading Terminal | PRO-TRADER",
    description: "Simulate Indian stock market options trades with zero risk for educational practice.",
    url: "/trades",
  },
};

export default function TradesPage() {
  return <TradesClient />;
}
