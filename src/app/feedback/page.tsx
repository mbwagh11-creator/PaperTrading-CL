import type { Metadata } from "next";
import FeedbackClient from "./FeedbackClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Feedback & Feature Requests | PRO-TRADER",
  description:
    "Share your feedback, suggest new features, or report issues for the PRO-TRADER paper trading terminal. Help us build the ultimate NSE options trading simulator.",
  keywords: [
    "PRO-TRADER feedback",
    "NSE paper trading feature request",
    "trading app user reviews",
    "option trading simulator support",
  ],
  alternates: {
    canonical: "/feedback",
  },
  openGraph: {
    title: "User Feedback & Community Reviews | PRO-TRADER",
    description: "Share your thoughts and shape the future of PRO-TRADER paper trading.",
    url: "/feedback",
  },
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
