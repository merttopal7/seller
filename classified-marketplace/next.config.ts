import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const prodHostname = appUrl ? new URL(appUrl).hostname : null;

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: isDev,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000" },
      ...(prodHostname
        ? [{ protocol: "https" as const, hostname: prodHostname }]
        : []),
    ],
  },
};

export default nextConfig;
