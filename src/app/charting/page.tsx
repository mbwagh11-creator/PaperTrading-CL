import { Metadata } from "next";
import ChartingClient from "./ChartingClient";

export const metadata: Metadata = {
  title: "Technical Charting & Bar Replay Practice Studio | PRO-TRADER",
  description:
    "Practice technical analysis drawing tools including Andrews' Pitchforks, Fibonacci Retracements, Support & Resistance Zones, and step-by-step Bar Replay simulation.",
};

export default function ChartingPage() {
  return <ChartingClient />;
}
