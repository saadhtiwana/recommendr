import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

// next/font downloads these at build time and serves them from our own domain (no runtime
// request to Google) with size-adjusted fallbacks, so there's no layout shift.

// Plus Jakarta Sans: a friendly geometric sans with strong bold weights, used for everything.
// Headlines and big numbers lean on 600-700 for clear hierarchy.
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-family",
  display: "swap",
});

// Geist Mono: code only (JSON-LD, robots.txt, config snippets).
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
