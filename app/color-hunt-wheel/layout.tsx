import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

export const metadata: Metadata = {
  title: "Color Hunt Wheel",
  description:
    "Hunt colors with friends",
};

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export default function ColorHuntWheelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={instrumentSerif.variable}>{children}</div>;
}
