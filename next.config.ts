import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dashboard-tracking.punjab.gov.pk",
      },
    ],
  },
};

export default nextConfig;
