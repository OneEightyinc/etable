import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "https://kiosk-eight-eta.vercel.app",
  env: {
    NEXT_PUBLIC_API_PREFIX: "/kiosk",
  },
  transpilePackages: ["@queue-platform/api"],
};

export default nextConfig;
