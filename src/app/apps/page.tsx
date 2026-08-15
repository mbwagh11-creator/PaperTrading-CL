"use client";

import Link from "next/link";
import { useState } from "react";
import AppDownloadBanner from "@/components/AppDownloadBanner";

export default function AppsPage() {
  const [copied, setCopied] = useState(false);

  const [missingApkModal, setMissingApkModal] = useState(false);

  async function handleApkDownload() {
    const apkUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || "/downloads/pro-trader.apk";
    try {
      const res = await fetch(apkUrl, { method: "HEAD" });
      if (!res.ok) {
        setMissingApkModal(true);
        return;
      }
      const link = document.createElement("a");
      link.href = apkUrl;
      link.download = "PRO-TRADER-v1.0.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setMissingApkModal(true);
    }
  }

  function handleCopyPwaUrl() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Page Header */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950 backdrop-blur-xl shadow-2xl p-8 md:p-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs text-accent font-semibold mb-4">
          <span>🚀 Official Website Apps</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white">
          Download PRO-TRADER Mobile Apps
        </h1>
        <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed mt-3">
          Get direct access to PRO-TRADER paper trading software. Download the standalone Android APK or install our Progressive Web App (PWA) directly from our website without app store logins.
        </p>
      </div>

      {/* Main Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Android APK Card */}
        <div className="rounded-3xl border border-accent/40 bg-gradient-to-b from-accent/10 via-slate-900/90 to-slate-950 p-8 shadow-[0_0_30px_rgba(97,255,201,0.15)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center text-2xl font-bold">
                🤖
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-slate-950">
                Direct APK
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Android Mobile App</h2>
              <p className="text-slate-300 text-sm mt-1">
                Full native-feel Android APK built specifically for options paper traders.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted">Version:</span>
                <span className="font-semibold text-white">v1.0.0 (Latest)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">File Size:</span>
                <span className="font-semibold text-white">~15.4 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">OS Compatibility:</span>
                <span className="font-semibold text-emerald-400">Android 8.0 & Above</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-accent font-bold">✓</span> Direct package download, no Play Store required
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent font-bold">✓</span> Instant live option chain quote refresh
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent font-bold">✓</span> One-tap order execution & stop loss manager
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleApkDownload}
              className="w-full rounded-2xl bg-accent px-6 py-4 font-black text-slate-950 text-base hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(97,255,201,0.25)] flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              <span>Download Android APK (v1.0)</span>
            </button>
            <p className="text-[11px] text-center text-muted">
              * Note: If prompted, enable "Install from Unknown Sources" on your Android device.
            </p>
          </div>
        </div>

        {/* Web PWA Card */}
        <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center text-2xl font-bold">
                📱
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-slate-200">
                iOS & Android PWA
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Progressive Web App (PWA)</h2>
              <p className="text-slate-300 text-sm mt-1">
                Zero download installation! Add directly to your smartphone home screen.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted">Installation:</span>
                <span className="font-semibold text-emerald-400">100% Instant (Zero Storage)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Compatibility:</span>
                <span className="font-semibold text-white">iPhone (Safari), Android (Chrome)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Auto Updates:</span>
                <span className="font-semibold text-accent">Always Up to Date</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-xs">
              <p className="font-bold text-white">How to Install PWA:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <span>1. Open this website link in Chrome or Safari on your phone.</span>
                <br />
                <span>2. Tap <strong>Share / Menu</strong> → <strong>Add to Home Screen</strong>.</span>
              </ol>
            </div>
          </div>

          <button
            onClick={handleCopyPwaUrl}
            className="w-full rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 px-6 py-4 font-bold text-white text-base transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
            </svg>
            <span>{copied ? "✓ Website Link Copied!" : "Copy Website Link for Phone"}</span>
          </button>
        </div>
      </div>

      {/* Banner Section */}
      <AppDownloadBanner />

      {/* Missing APK File Modal */}
      {missingApkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-accent/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">📱 Android APK Setup Guide</h3>
              <button
                onClick={() => setMissingApkModal(false)}
                className="text-muted hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300">
              The compiled <code>pro-trader.apk</code> file has not been placed in <code>public/downloads/</code> yet.
            </p>

            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-2xl border border-white/10 text-slate-300">
              <p className="font-semibold text-accent">How to enable direct APK download:</p>
              <p>1. Copy your compiled APK file to <code>public/downloads/pro-trader.apk</code>.</p>
              <p>2. Or add <code>NEXT_PUBLIC_APK_DOWNLOAD_URL=https://...</code> to your <code>.env</code> file.</p>
            </div>

            <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl text-xs text-accent">
              💡 <strong>Instant Alternative:</strong> Use the Progressive Web App (PWA) directly on your phone home screen!
            </div>

            <button
              onClick={() => setMissingApkModal(false)}
              className="w-full bg-accent text-slate-950 font-bold py-2.5 rounded-xl hover:brightness-95 text-xs text-center"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
