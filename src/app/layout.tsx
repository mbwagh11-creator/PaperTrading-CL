import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PRO-TRADER",
  description: "NSE options paper trading, journal & analytics",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRO-TRADER",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
