import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";

// next/font downloads these at build time and serves them from our own domain: no request to
// Google at runtime, and size-adjusted fallbacks avoid layout shift while fonts load.

// Newsreader: an editorial text serif with an optical-size axis, so 56px headlines get the
// sharper "display" cut and small serif text stays sturdy.
export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

// IBM Plex Sans: engineered, slightly technical grotesque with real tabular figures; reads as an
// instrument, not as the default Inter look.
export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

// IBM Plex Mono: same skeleton as Plex Sans, so numbers in mono sit comfortably next to UI text.
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});
