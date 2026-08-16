"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FeedbackItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  message: string;
  createdAt: string;
}

const CATEGORIES = ["General", "Feature Suggestion", "Bug Report", "UX Improvement"];

export default function FeedbackClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  // Fetch logged-in user info if present & load public feedbacks
  useEffect(() => {
    async function loadData() {
      try {
        const [feedRes, subRes] = await Promise.all([
          fetch("/api/feedback"),
          fetch("/api/subscription/status").catch(() => null),
        ]);

        if (feedRes.ok) {
          const feedData = await feedRes.json();
          if (feedData.feedbacks) {
            setFeedbacks(feedData.feedbacks);
          }
        }

        if (subRes && subRes.ok) {
          const subData = await subRes.json();
          if (subData.user) {
            setName(subData.user.name || "");
            setEmail(subData.user.email || "");
          }
        }
      } catch {
        // ignore fallback
      } finally {
        setLoadingFeedbacks(false);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill in your name, email, and feedback message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          rating,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setSuccessMsg("🎉 Thank you! Your feedback has been submitted successfully and shared with our team.");
      setMessage("");
      
      // Refresh feedback list
      const updatedRes = await fetch("/api/feedback");
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        if (updatedData.feedbacks) setFeedbacks(updatedData.feedbacks);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-slate-100 placeholder:text-slate-500";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
          💬 User Voice & Suggestions
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          We’d Love to Hear Your Feedback
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Have an idea for a new feature? Noticed something we can improve? Share your thoughts below and help us build the finest NSE paper trading platform!
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Feedback Submission Form */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>✍️ Submit Your Feedback</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your feedback directly shapes upcoming PRO-TRADER updates.
            </p>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                      category === cat
                        ? "bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                        : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Rating</label>
              <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl focus:outline-none transition-transform hover:scale-125"
                    >
                      <span
                        className={
                          star <= (hoverRating || rating)
                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "text-slate-600"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-semibold ml-2">
                  {rating === 5 && "🌟 Outstanding"}
                  {rating === 4 && "👍 Very Good"}
                  {rating === 3 && "👌 Good"}
                  {rating === 2 && "😐 Needs Improvement"}
                  {rating === 1 && "👎 Unsatisfactory"}
                </span>
              </div>
            </div>

            {/* Name & Email inputs */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Manoj Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. manoj@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Feedback message text area */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Your Message</label>
              <textarea
                rows={4}
                placeholder="Share your thoughts, report a bug, or suggest a new feature..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl transition-all shadow-[0_10px_30px_rgba(52,211,153,0.25)] hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm"
            >
              {submitting ? "Submitting Feedback..." : "Submit Feedback →"}
            </button>
          </form>
        </div>

        {/* Community Reviews Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⭐ Community Reviews & Feedback</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {feedbacks.length} Submissions
            </span>
          </div>

          {loadingFeedbacks ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-900/60 rounded-2xl border border-white/10">
              Loading community feedback...
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-900/60 rounded-2xl border border-white/10 space-y-2">
              <p className="font-semibold text-slate-300">No feedback submitted yet!</p>
              <p className="text-xs text-slate-500">Be the first to share your thoughts using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-slate-900/70 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-400/20">
                        {fb.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{fb.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(fb.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full font-semibold">
                        {fb.category}
                      </span>
                      <div className="flex text-amber-400 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < fb.rating ? "text-amber-400" : "text-slate-700"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-10 border-l-2 border-emerald-400/30">
                    "{fb.message}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
