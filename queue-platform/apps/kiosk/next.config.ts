import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.VERCEL ? "/kiosk" : "",
  env: {
    NEXT_PUBLIC_API_PREFIX: "/kiosk",
  },
  transpilePackages: ["@queue-platform/api"],
  async redirects() {
    return [
      { source: "/k", destination: "/", permanent: false },
      { source: "/k/", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
