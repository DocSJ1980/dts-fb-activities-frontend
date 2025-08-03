import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from Kobo hosts and existing dashboard host
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dashboard-tracking.punjab.gov.pk",
        pathname: "/**",
      },
      // KoboToolbox self-hosted (example)
      {
        protocol: "https",
        hostname: "kf.dharawalpindi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kc.dharawalpindi.com",
        pathname: "/**",
      },
      // Official KoboToolbox hosts (in case assets are moved)
      {
        protocol: "https",
        hostname: "kf.kobotoolbox.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kc.kobotoolbox.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
