"use client";

import { useState } from "react";
import Link from "next/link";

export default function AppDownloadBanner() {
  const [downloadModal, setDownloadModal] = useState(false);
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

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-xs text-accent font-semibold">
              <span>📱 Official Website Apps (Direct Download)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Take PRO-TRADER Anywhere
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Download our official Android APK or install our ultra-fast Web App directly on your smartphone — no Play Store or App Store needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {/* Direct APK Download Button */}
            <button
              onClick={handleApkDownload}
              className="flex items-center gap-3 bg-accent text-slate-950 font-bold hover:brightness-110 px-5 py-3 rounded-2xl transition-all duration-200 shadow-[0_8px_25px_rgba(97,255,201,0.25)] group"
            >
              <svg className="w-6 h-6 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-800">Direct Download</p>
                <p className="text-sm font-black text-slate-950">Android APK (v1.0)</p>
              </div>
            </button>

            {/* PWA / Web App Install Button */}
            <button
              onClick={() => setDownloadModal(true)}
              className="flex items-center gap-3 bg-slate-950 border border-white/15 hover:border-accent hover:bg-slate-900 text-white px-5 py-3 rounded-2xl transition-all duration-200 shadow-lg group"
            >
              <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,1H7A2,2 0 0,0 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3A2,2 0 0,0 17,1M17,19H7V5H17V19M16,13H13V8H11V13H8L12,17L16,13Z" />
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Instant Install</p>
                <p className="text-sm font-bold text-slate-100 group-hover:text-accent">Web App (PWA)</p>
              </div>
            </button>

            {/* All Apps Page Link */}
            <Link
              href="/apps"
              className="flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs px-4 py-3 rounded-2xl transition-all"
            >
              View All Apps →
            </Link>
          </div>
        </div>
      </div>

      {/* PWA Installation Modal */}
      {downloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Install PRO-TRADER Web App</h3>
              <button
                onClick={() => setDownloadModal(false)}
                className="text-muted hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300">
              Install PRO-TRADER on your phone home screen without downloading files:
            </p>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-white/5">
              <div className="flex gap-3 items-start">
                <span className="text-accent font-bold text-base">1.</span>
                <span>Open this website on <strong>Chrome (Android)</strong> or <strong>Safari (iOS)</strong>.</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-accent font-bold text-base">2.</span>
                <span>Tap <strong>Menu (⋮)</strong> or the <strong>Share Button</strong>.</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-accent font-bold text-base">3.</span>
                <span>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApkDownload}
                className="flex-1 bg-accent text-slate-950 font-bold py-2.5 rounded-xl hover:brightness-95 text-xs text-center"
              >
                Download APK Instead
              </button>
              <button
                onClick={() => setDownloadModal(false)}
                className="bg-white/10 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/20 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              💡 <strong>Instant Alternative:</strong> Tap <strong>"Install Web App (PWA)"</strong> to use the mobile app immediately on your phone without downloading an APK!
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setMissingApkModal(false);
                  setDownloadModal(true);
                }}
                className="flex-1 bg-accent text-slate-950 font-bold py-2.5 rounded-xl hover:brightness-95 text-xs text-center"
              >
                Use Web PWA Instead
              </button>
              <button
                onClick={() => setMissingApkModal(false)}
                className="bg-white/10 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/20 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


