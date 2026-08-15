"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "What is PRO-TRADER paper trading?",
    answer:
      "PRO-TRADER is a real-time paper trading platform for Indian stock market derivatives. It lets traders practice buying and selling NSE Nifty 50, Nifty Bank, and stock options with virtual money using live market quotes before risking real capital.",
  },
  {
    question: "Is paper trading on PRO-TRADER completely free?",
    answer:
      "Yes! Every user gets a 7-day full feature free trial with zero risk. Afterward, you can upgrade to the PRO plan for just ₹149/month to get unlimited paper trades, live market quotes, trade journal, and performance analytics.",
  },
  {
    question: "How are NSE option prices and P&L calculated?",
    answer:
      "PRO-TRADER fetches real-time market data quotes from NSE indices and stocks. Option strike premiums (Call & Put options) are calculated dynamically using Black-Scholes pricing models, current spot prices, and volatility models, updated continuously.",
  },
  {
    question: "Do I need a broker account or API keys?",
    answer:
      "No! PRO-TRADER runs on a 100% standalone, real-time NSE market quote engine. You can start paper trading immediately without connecting any broker accounts or API keys.",
  },
  {
    question: "How does the Trade Journal work?",
    answer:
      "The Trade Journal automatically records every order you execute. It groups your trades by day, month, and year, producing a visual daily P&L calendar heatmap, win rate stats, average profit/loss breakdown, and total closed P&L metrics.",
  },
];

export default function SEOFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="space-y-6 pt-4">
      {/* FAQ JSON-LD Schema for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="text-muted text-sm max-w-xl mx-auto">
          Everything you need to know about paper trading NSE stocks & options on PRO-TRADER.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-100 hover:text-accent transition-colors gap-4"
              >
                <span>{item.question}</span>
                <span className="text-accent text-lg font-bold">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
