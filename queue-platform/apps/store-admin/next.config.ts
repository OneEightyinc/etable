import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.VERCEL ? "/store" : "",
  transpilePackages: ["@queue-platform/api"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
