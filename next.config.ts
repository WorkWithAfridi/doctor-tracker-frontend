import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const upstream = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
    ).replace(/\/$/, "");
    if (!/^https?:\/\//.test(upstream))
      throw new Error(
        "NEXT_PUBLIC_API_URL must be an absolute backend API URL",
      );
    return [{ source: "/api/:path*", destination: `${upstream}/:path*` }];
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
