import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Recommendr",
    short_name: "Recommendr",
    description: "See if AI assistants recommend your business, and fix it.",
    start_url: "/",
    display: "standalone",
    theme_color: "#111311",
    background_color: "#FAFAF8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
