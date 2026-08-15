import type { Metadata } from "next";
import TradesClient from "./TradesClient";

export const metadata: Metadata = {
  title: "NSE Options Paper Trading Terminal | Nifty & Bank Nifty Simulator",
  description:
    "Place virtual trades on NSE Call & Put options, stocks, and index derivatives. Track real-time P&L with 5-second market quote updates.",
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
    description: "Simulate Indian stock market options trades in real-time with zero risk.",
    url: "/trades",
  },
};

export default function TradesPage() {
  return <TradesClient />;
}
