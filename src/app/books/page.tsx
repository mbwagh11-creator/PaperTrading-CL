import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Stock & Options Trading E-Books (PDF) | PRO-TRADER",
  description:
    "Free educational trading books and PDF resources for Indian stock market traders. Learn price action, option strategies, and risk management.",
  alternates: {
    canonical: "/books",
  },
};

export default function BooksPage() {
  const pdfUrl = "/books/trading-guide.pdf";

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          📚 Free Educational Resource for Traders
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
          Mastering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Options & Price Action</span> E-Book
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Comprehensive step-by-step guide on Nifty & Bank Nifty option strategies, risk management, positioning, and strategy journaling. Free download for all PRO-TRADER members.
        </p>
      </div>

      {/* Compliance Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-xs text-amber-200/90 leading-relaxed max-w-3xl mx-auto">
        ⚠️ <strong>Educational Purpose Disclaimer:</strong> This PDF book is provided strictly for educational and self-learning purposes only. PRO-TRADER does not guarantee trading profits, provide investment advice, or offer SEBI registered tips.
      </div>

      {/* E-Book Action Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              📘 Complete NSE Trading Strategy Guide (PDF)
            </h2>
            <p className="text-xs text-slate-300">
              Format: Digital PDF • Download Size: ~2.4 MB • Free Access
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-black font-extrabold text-xs px-5 py-3 rounded-xl hover:brightness-105 transition-all shadow-[0_4px_14px_rgba(97,255,201,0.2)] flex items-center gap-2"
            >
              👁️ Open PDF In Browser
            </a>
            <a
              href={pdfUrl}
              download="PRO-TRADER-Trading-Guide.pdf"
              className="bg-white/10 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
            >
              📥 Download PDF Book
            </a>
          </div>
        </div>

        {/* Embedded Interactive PDF Previewer */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            📖 In-App Digital Reader Preview
          </h3>
          <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950 h-[600px] w-full relative">
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full border-none"
              title="Trading Strategy Book Preview"
            />
          </div>
        </div>

        {/* Owner Instructions Card */}
        <div className="rounded-xl bg-slate-950 p-4 border border-white/5 space-y-2 text-xs text-slate-400">
          <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
            💡 Owner Note (How to replace or update your PDF):
          </p>
          <p className="leading-relaxed">
            To add or replace your custom PDF book file anytime, simply drop your PDF file into your project at:
            <code className="text-amber-300 ml-1">public/books/trading-guide.pdf</code>. It will automatically update live on your website!
          </p>
        </div>
      </div>
    </div>
  );
}
