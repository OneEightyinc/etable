import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_PREFIX: "",
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
