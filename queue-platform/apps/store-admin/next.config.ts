import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.VERCEL ? "/store" : "",
  assetPrefix: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  transpilePackages: ["@queue-platform/api"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
