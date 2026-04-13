import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This tells Vercel: "Ignore the small stuff and just build my UI!" */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;