import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.VERCEL ? "https://kiosk-eight-eta.vercel.app" : undefined,
  env: {
    NEXT_PUBLIC_API_PREFIX: "/kiosk",
  },
  transpilePackages: ["@queue-platform/api"],
};

export default nextConfig;
