import type { Metadata } from "next";
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Mathematics of The Third Trade (PDF Book) | PRO-TRADER",
  description:
    "An Expected Value Study of Hit Rate, Ratio, Cost, and Conditional Trade-Stacking in BankNifty Options. Read the complete 14-chapter trading notebook online or download free PDF.",
  keywords: [
    "The Mathematics of The Third Trade",
    "BankNifty options trading math",
    "Trading risk reward ratio book",
    "FXCM trading hit rate study",
    "Free trading e-book PDF India",
  ],
  alternates: {
    canonical: "/books",
  },
  openGraph: {
    title: "The Mathematics of The Third Trade | Free Trading Book",
    description: "An Expected Value Study of Hit Rate, Ratio, Cost, and Conditional Trade-Stacking in BankNifty Options.",
    url: "/books",
  },
};

export default function BooksPage() {
  return <BookClient />;
}
