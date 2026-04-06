import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * デプロイ先ホストごとに同一オリジンの静的アセットを参照する（古い固定 URL のままだと
   * 別プロジェクトの _next を読みに行き 404 になる）。
   */
  assetPrefix:
    process.env.VERCEL && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
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
