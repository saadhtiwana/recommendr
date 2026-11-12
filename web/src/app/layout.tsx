import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recommendr: see if AI assistants recommend your business",
  description:
    "Free, open-source AI search visibility: find out whether ChatGPT, Gemini, Perplexity and Claude recommend your business, who they recommend instead and why, and how to fix it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
