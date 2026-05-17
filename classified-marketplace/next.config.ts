import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const prodHostname = appUrl ? new URL(appUrl).hostname : null;
const prodProtocol = appUrl ? new URL(appUrl).protocol.replace(":", "") : "https";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const backendHostname = backendUrl ? new URL(backendUrl).hostname : null;
const backendPort = backendUrl ? new URL(backendUrl).port : null;
const backendProtocol = backendUrl ? new URL(backendUrl).protocol.replace(":", "") : "https";

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
        ? [{ protocol: prodProtocol as any, hostname: prodHostname }]
        : []),
      ...(backendHostname
        ? [{ 
            protocol: backendProtocol as any, 
            hostname: backendHostname, 
            ...(backendPort ? { port: backendPort } : {}) 
          }]
        : []),
    ],
  },
};

export default nextConfig;
