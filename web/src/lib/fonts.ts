import { Geist, Geist_Mono } from "next/font/google";

// next/font downloads these at build time and serves them from our own domain: no request to
// Google at runtime, and size-adjusted fallbacks avoid layout shift while fonts load.

// Geist: one tight, modern grotesk for headlines and UI. Large sizes use negative tracking
// (see --text-display/h1/h2 in globals.css) for the dense, confident headline look.
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

// Geist Mono: numbers, percentages, timestamps, model IDs and code. Same proportions as Geist,
// so figures sit naturally next to UI text.
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
