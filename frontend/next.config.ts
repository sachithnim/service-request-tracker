import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The home page is the request list.
  async redirects() {
    return [{ source: "/", destination: "/requests", permanent: false }];
  },
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
