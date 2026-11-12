import type { Metadata, Viewport } from "next";
import { geistMono, jakarta } from "@/lib/fonts";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "Recommendr: see if AI assistants recommend your business";
const DESCRIPTION =
  "Free, open-source AI search visibility: find out whether ChatGPT, Gemini, Perplexity and Claude recommend your business, who they recommend instead and why, and how to fix it.";

// Favicons come from App Router file conventions (app/icon.svg, app/favicon.ico,
// app/apple-icon.png); the manifest from app/manifest.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Recommendr",
  openGraph: {
    type: "website",
    siteName: "Recommendr",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "Ask ChatGPT about your industry. See if it mentions you." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-bg text-ink">{children}</body>
    </html>
  );
}
