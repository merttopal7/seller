import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true, // Bypasses remotePatterns restrictions and server-side CPU-heavy resizing.
                       // Highly recommended since backend already resizes and optimizes all uploads to WebP format.
  },
};

export default nextConfig;
