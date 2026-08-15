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
  const [subscribing, setSubscribing] = useState(false);
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

  async function handleSubscribe() {
    if (!data?.loggedIn) {
      window.location.href = "/login";
      return;
    }

    setSubscribing(true);
    setSubMessage("");

    try {
      // 1. Create order backend call
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            demoMode: true,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

        setSubMessage("🎉 Subscription activated! (Demo Mode — Add RAZORPAY_KEY_ID to .env to receive live payments)");
        loadStatus();
        return;
      }

      // 3. Live Razorpay Payment Modal Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PRO-TRADER",
        description: "Monthly PRO Subscription Plan (₹149/mo)",
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
                demoMode: false,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

            setSubMessage("🎉 Payment successful! PRO-TRADER subscription is active.");
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
      setSubscribing(false);
    }
  }

  const sub = data?.subscription;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-accent text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">
            Subscription Plans
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            7 Days Free Trial, then <span className="text-accent">₹149/month</span>
          </h1>
          <p className="text-slate-300 max-w-3xl text-sm md:text-base leading-relaxed">
            Full access to NSE stock and option paper trading, real-time market data quotes, live position P&L tracking, and performance analytics.
          </p>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border border-accent/50 bg-gradient-to-b from-accent/10 via-slate-900/90 to-slate-950 p-8 shadow-[0_0_0_1px_rgba(97,255,201,0.2),0_25px_70px_rgba(20,185,130,0.25)] space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full bg-accent text-black">
                Unlimited Access
              </span>
              <h2 className="text-2xl font-bold text-white mt-3">PRO-TRADER Plan</h2>
              <p className="text-muted text-sm mt-1">
                7 days free trial (₹0), then ₹149 per month. Cancel anytime.
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold text-white">₹149</span>
              <span className="text-muted text-sm block">/ month</span>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm flex items-center justify-between text-accent">
            <span className="font-semibold">✨ 7 Days Free Trial Included</span>
            <span className="text-xs text-slate-300">₹0 charged today</span>
          </div>

          <ul className="space-y-3 text-sm">
            {[
              "Unlimited NSE options & stock paper trades",
              "Real-time market quotes & auto-price updates",
              "Live option premium calculator (CE / PE strikes)",
              "Live position P&L tracking with 5s auto-refresh",
              "Performance analytics, win rates & trade journal",
              "Optional Upstox broker API connection",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-slate-200">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Current Status Box if logged in */}
          {data?.loggedIn && sub && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between items-center font-medium text-sm">
                <span>Account Status:</span>
                <span
                  className={
                    sub.status === "ACTIVE"
                      ? "text-accent font-bold"
                      : sub.status === "TRIAL"
                      ? "text-emerald-400 font-bold"
                      : "text-danger font-bold"
                  }
                >
                  {sub.status === "ACTIVE" && "🟢 PRO Active"}
                  {sub.status === "TRIAL" && `⚡ Free Trial Active (${sub.trialDaysRemaining} days remaining)`}
                  {sub.status === "EXPIRED" && "⚠️ Trial Expired"}
                </span>
              </div>
              {sub.trialEndsAt && sub.status === "TRIAL" && (
                <p className="text-muted">Trial ends on: {new Date(sub.trialEndsAt).toLocaleDateString("en-IN")}</p>
              )}
              {sub.subscriptionEndsAt && sub.status === "ACTIVE" && (
                <p className="text-muted">Plan renews on: {new Date(sub.subscriptionEndsAt).toLocaleDateString("en-IN")}</p>
              )}
            </div>
          )}

          {/* Action Button */}
          {!data?.loggedIn ? (
            <Link
              href="/login"
              className="block w-full text-center rounded-xl bg-accent px-4 py-3.5 font-bold text-black text-base hover:brightness-95 transition-all shadow-[0_10px_30px_rgba(97,255,201,0.25)]"
            >
              Start 7-Day Free Trial (₹0)
            </Link>
          ) : sub?.status === "ACTIVE" ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full rounded-xl bg-accent/20 border border-accent text-accent px-4 py-3.5 font-bold text-base cursor-default"
              >
                ✓ Subscription Active
              </button>
              <p className="text-center text-xs text-muted">Thank you for subscribing to PRO-TRADER!</p>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full rounded-xl bg-accent px-4 py-3.5 font-bold text-black text-base hover:brightness-95 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(97,255,201,0.25)]"
            >
              {subscribing
                ? "Processing Checkout..."
                : sub?.status === "TRIAL"
                ? "Subscribe Now (₹149 / month)"
                : "Unlock Full Access (₹149 / month)"}
            </button>
          )}

          {subMessage && (
            <p
              className={`text-center text-xs font-semibold p-2.5 rounded-xl ${
                subMessage.includes("successful") ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"
              }`}
            >
              {subMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
