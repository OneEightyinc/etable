import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: "",
  },
  transpilePackages: ["@queue-platform/api"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
