import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@queue-platform/api"],
  async rewrites() {
    return [
      {
        source: "/store/:path*",
        destination: "https://store-admin-v2-rosy.vercel.app/:path*",
      },
      {
        source: "/kiosk/:path*",
        destination: "https://kiosk-eight-eta.vercel.app/:path*",
      },
      {
        source: "/admin/:path*",
        destination: "https://master-admin-xi.vercel.app/:path*",
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
