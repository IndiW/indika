import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";

export const metadata: Metadata = {
  title: "Color Hunt Wheel",
  description:
    "Spin a color wheel to assign each person in your group a color to go hunt and shoot.",
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
