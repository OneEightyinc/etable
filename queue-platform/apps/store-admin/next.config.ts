import type { NextConfig } from "next";

const basePath = process.env.VERCEL ? "/store" : "";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  transpilePackages: ["@queue-platform/api"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
