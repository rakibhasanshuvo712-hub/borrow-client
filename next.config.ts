import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // Listing photos are supplied by users as arbitrary URLs, so any remote
    // host must be accepted. The optimizer still only fetches images; broken
    // or non-image URLs fall back to the placeholder in ItemCard.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default config;
