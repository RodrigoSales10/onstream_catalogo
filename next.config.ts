import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/lista-filmes:page(\\d+)",
        destination: "/lista-filmes/:page",
      },
    ];
  },
};

export default nextConfig;
