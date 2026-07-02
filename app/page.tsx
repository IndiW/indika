import type { Metadata } from "next";
import Canvas from "./components/Canvas";
import { SITE_URL } from "./lib/site";

const TITLE = "Indika Wijesundera — Software Engineer & Builder";
const DESCRIPTION =
  "Portfolio of Indika Wijesundera, a Toronto-based software engineer who ships full-stack products from zero to one. Explore projects including Wijelaw, Dr. Kemi, Athena, Flashcards, and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Indika Wijesundera",
    "Software Engineer",
    "Full-Stack Developer",
    "Toronto",
    "Portfolio",
    "Web Developer",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Indika Wijesundera",
    type: "profile",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Indika Wijesundera",
  jobTitle: "Software Engineer",
  url: SITE_URL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Toronto",
    addressRegion: "ON",
    addressCountry: "CA",
  },
  sameAs: [
    "https://github.com/IndiW",
    "https://www.linkedin.com/in/indika-wijesundera/",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Canvas />
    </>
  );
}
