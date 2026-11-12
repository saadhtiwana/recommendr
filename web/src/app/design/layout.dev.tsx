import type { Metadata } from "next";
import type { ReactNode } from "react";

// Development-only (see next.config.ts): this layout and every /design route are never part of
// a production build.
export const metadata: Metadata = {
  title: "Design previews · Recommendr",
  robots: { index: false, follow: false },
};

// Plain props type (not LayoutProps<"/design">): production type-checking has no /design route.
export default function DesignLayout({ children }: { children: ReactNode }) {
  return children;
}
