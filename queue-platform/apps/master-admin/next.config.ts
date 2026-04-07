import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.VERCEL ? "/admin" : "",
  env: {
    NEXT_PUBLIC_API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX ?? "",
    NEXT_PUBLIC_STORE_ADMIN_URL: process.env.NEXT_PUBLIC_STORE_ADMIN_URL ?? "",
    NEXT_PUBLIC_KIOSK_URL: process.env.NEXT_PUBLIC_KIOSK_URL ?? "",
    NEXT_PUBLIC_CUSTOMER_PORTAL_URL: process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? "",
  },
  transpilePackages: ["@queue-platform/api"],
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
