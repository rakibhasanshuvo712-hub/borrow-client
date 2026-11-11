import type { NextConfig } from "next";

const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://borrowhub-server.vercel.app"
).replace(/\/$/, "");

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default config;
