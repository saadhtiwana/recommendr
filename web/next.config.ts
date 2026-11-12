import type { NextConfig } from "next";

// Design preview routes live in files named `page.dev.tsx` / `layout.dev.tsx`. The `dev.tsx` page
// extension is only registered outside production, so `next build` never emits /design/*:
// previews can use mock data freely without any risk of shipping them.
const isProductionBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  pageExtensions: isProductionBuild ? ["tsx", "ts"] : ["dev.tsx", "tsx", "ts"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
