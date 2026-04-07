import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@queue-platform/api"],
  async rewrites() {
    return [
      {
        source: "/store/:path*",
        destination: "https://store-admin-jade.vercel.app/store/:path*",
      },
      {
        source: "/kiosk/:path*",
        destination: "https://kiosk-eight-eta.vercel.app/kiosk/:path*",
      },
      {
        source: "/admin/:path*",
        destination: "https://master-admin-xi.vercel.app/admin/:path*",
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
