import path from "path";
import type { NextConfig } from "next";

const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@queue-platform/api"],
  // Vercel / monorepo: trace shared package from queue-platform root
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
