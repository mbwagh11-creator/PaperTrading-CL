"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubData {
  loggedIn: boolean;
  user?: { name: string; email: string };
  subscription: {
    status: "TRIAL" | "ACTIVE" | "EXPIRED";
    trialDaysRemaining: number;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    planName: string;
  } | null;
}

export default function PricingClient() {
  const [data, setData] = useState<SubData | null>(null);
  const [subscribingPlan, setSubscribingPlan] = useState<"DAY_PASS" | "MONTHLY" | null>(null);
  const [subMessage, setSubMessage] = useState("");

  async function loadStatus() {
    try {
      const res = await fetch("/api/subscription/status", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ loggedIn: false, subscription: null });
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleCheckout(planType: "DAY_PASS" | "MONTHLY") {
    if (!data?.loggedIn) {
      window.location.href = "/login";
      return;
    }

    setSubscribingPlan(planType);
    setSubMessage("");

    try {
      // 1. Create order backend call
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to initialize order");

      // 2. Demo mode handler if Razorpay keys are not added to .env yet
      if (orderData.demoMode) {
        const verifyRes = await fetch("/api/subscription/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `PAY_TEST_${Date.now()}`,
            planType,
            demoMode: true,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

        setSubMessage(
          planType === "DAY_PASS"
            ? "⚡ 24-Hour Day Pass activated! (Demo Mode)"
            : "🎉 Monthly Subscription activated! (Demo Mode)"
        );
        loadStatus();
        return;
      }

      // 3. Live Razorpay Payment Modal Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const planTitle = planType === "DAY_PASS" ? "24-Hour Day Pass (₹15)" : "Monthly PRO Plan (₹149/mo)";

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PRO-TRADER",
        description: planTitle,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/subscription/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType,
                demoMode: false,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

            setSubMessage(`🎉 Payment successful! ${planTitle} activated.`);
            loadStatus();
          } catch (err: any) {
            setSubMessage(`Verification error: ${err.message}`);
          }
        },
        prefill: {
          name: data?.user?.name || "",
          email: data?.user?.email || "",
        },
        theme: {
          color: "#61FFC9",
        },
      };

      const razorpayWindow = new (window as any).Razorpay(options);
      razorpayWindow.open();
    } catch (err: any) {
      setSubMessage(`Checkout error: ${err.message}`);
    } finally {
      setSubscribingPlan(null);
    }
  }

  const sub = data?.subscription;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-accent text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Flexible Trader Plans
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Choose Your <span className="text-accent">Paper Trading Pass</span>
          </h1>
          <p className="text-slate-300 max-w-3xl text-sm md:text-base leading-relaxed">
            Practice NSE options & stock paper trades risk-free. Pick a 24-hour day pass for quick strategy testing or go monthly for unlimited access.
          </p>
        </div>
      </div>

      {subMessage && (
        <div
          className={`max-w-4xl mx-auto p-4 rounded-2xl text-center text-sm font-bold border ${
            subMessage.includes("successful") || subMessage.includes("activated")
              ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/50 text-rose-300 border-rose-500/40"
          }`}
        >
          {subMessage}
        </div>
      )}

      {/* Subscription Cards Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
        {/* PLAN 1: 24-Hour Day Pass (₹15) */}
        <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-amber-400 text-black">
                  ⚡ 24-Hour Day Pass
                </span>
                <h2 className="text-2xl font-bold text-white mt-3">Daily Trader Pass</h2>
                <p className="text-slate-300 text-xs mt-1">
                  Perfect for quick weekend testing or 1-day trading practice.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-4xl font-extrabold text-amber-300">₹15</span>
                <span className="text-slate-400 text-xs block">/ 24 Hours</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200 font-medium">
              ⚡ Instant 24-hour full access to place trades & option chain
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>24 Hours unlimited NSE paper trading</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Real-time NSE option chain & live quotes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Risk/Reward position sizing calculator</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Permanent trade journal & analytics log</span>
              </li>
            </ul>
          </div>

          {!data?.loggedIn ? (
            <Link
              href="/login"
              className="block w-full text-center rounded-xl bg-amber-400 px-4 py-3 font-bold text-black text-sm hover:brightness-95 transition-all"
            >
              Get 24-Hour Pass (₹15)
            </Link>
          ) : (
            <button
              onClick={() => handleCheckout("DAY_PASS")}
              disabled={subscribingPlan !== null}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-black text-sm hover:brightness-95 transition-all disabled:opacity-50"
            >
              {subscribingPlan === "DAY_PASS" ? "Processing..." : "Buy 24-Hour Day Pass (₹15)"}
            </button>
          )}
        </div>

        {/* PLAN 2: Monthly PRO Plan (₹149/mo) */}
        <div className="rounded-3xl border border-emerald-400/50 bg-gradient-to-b from-emerald-500/10 via-slate-900/90 to-slate-950 p-8 shadow-[0_0_0_1px_rgba(97,255,201,0.2),0_25px_70px_rgba(20,185,130,0.25)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-emerald-400 text-black">
                  👑 Most Popular
                </span>
                <h2 className="text-2xl font-bold text-white mt-3">Monthly PRO Plan</h2>
                <p className="text-slate-300 text-xs mt-1">
                  Includes 7 Days Free Trial (₹0), then ₹149/month. Cancel anytime.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-4xl font-extrabold text-emerald-300">₹149</span>
                <span className="text-slate-400 text-xs block">/ Month</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200 font-medium">
              ✨ 7 Days Free Trial Included (₹0 charged today)
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>30 Days unlimited NSE options & stock paper trades</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Interactive Option Chain matrix with 1-click execution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Real-time Risk/Reward calculator</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Monthly P&L calendar heatmap & performance analytics</span>
              </li>
            </ul>
          </div>

          {!data?.loggedIn ? (
            <Link
              href="/login"
              className="block w-full text-center rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black text-sm hover:brightness-95 transition-all"
            >
              Start 7-Day Free Trial (₹0)
            </Link>
          ) : sub?.status === "ACTIVE" ? (
            <button
              disabled
              className="w-full rounded-xl bg-emerald-400/20 border border-emerald-400 text-emerald-300 px-4 py-3 font-bold text-sm cursor-default"
            >
              ✓ PRO Subscription Active
            </button>
          ) : (
            <button
              onClick={() => handleCheckout("MONTHLY")}
              disabled={subscribingPlan !== null}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-black text-sm hover:brightness-95 transition-all disabled:opacity-50"
            >
              {subscribingPlan === "MONTHLY" ? "Processing..." : "Subscribe Monthly (₹149 / month)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
