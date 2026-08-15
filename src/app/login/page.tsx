import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Trader Login & Account Registration | PRO-TRADER",
  description:
    "Sign in to your PRO-TRADER account or start your 7-day free trial to paper trade NSE Nifty 50, Bank Nifty, and stock options in real-time.",
  keywords: [
    "PRO-TRADER login",
    "NSE paper trading sign up",
    "Paper trading account India",
    "Options trading simulator register",
  ],
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Trader Login | PRO-TRADER Paper Trading Terminal",
    description: "Access your personalized NSE options paper trading workspace and strategy journal.",
    url: "/login",
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
