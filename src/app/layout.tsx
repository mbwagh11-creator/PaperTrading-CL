import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://protrader.app";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PRO-TRADER | #1 NSE Options & Stock Paper Trading Platform in India",
    template: "%s | PRO-TRADER - NSE Options Paper Trading & Journal",
  },
  description:
    "Practice Indian stock market options paper trading with zero risk. Features real-time NSE Nifty & Bank Nifty quotes, call/put strike simulator, automated trade journal, daily P&L calendar, and Upstox API integration.",
  keywords: [
    "NSE paper trading",
    "Options paper trading India",
    "Nifty 50 option trading simulator",
    "Bank Nifty paper trading",
    "Free stock trading simulator India",
    "NSE trade journal",
    "Options premium calculator",
    "Upstox paper trading app",
    "Derivatives paper trading",
    "Virtual trading India",
    "Live PnL tracker",
    "Indian stock market simulator",
    "Option strategy journal",
    "Call Put option simulator",
    "NSE share paper trading",
  ],
  authors: [{ name: "PRO-TRADER Team", url: SITE_URL }],
  creator: "PRO-TRADER",
  publisher: "PRO-TRADER",
  category: "Finance & Trading",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "PRO-TRADER",
    title: "PRO-TRADER | Real-Time NSE Options Paper Trading App",
    description:
      "Practice Nifty & Bank Nifty options paper trading with live quotes, trade journal, and performance analytics. Zero risk virtual trading for Indian stock markets.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "PRO-TRADER NSE Options Paper Trading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRO-TRADER | NSE Options & Stock Paper Trading App",
    description:
      "Master NSE options trading risk-free. Real-time Nifty 50 and Bank Nifty option chain simulation, automated P&L journal, and trading analytics.",
    images: ["/icon.svg"],
    creator: "@protrader_app",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRO-TRADER",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PRO-TRADER",
    operatingSystem: "Web, iOS, Android",
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "149",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
    },
    description:
      "Real-time Indian Stock Market (NSE) options paper trading software with live market quotes, trade journal, and performance analytics.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "1280",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PRO-TRADER",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 antialiased">
        <div>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
