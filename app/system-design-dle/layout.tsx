import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

export const metadata: Metadata = {
  title: "SystemDesigndle",
  description: "Daily system design concept puzzle.",
};

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export default function SystemDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={instrumentSerif.variable}>{children}</div>;
}
