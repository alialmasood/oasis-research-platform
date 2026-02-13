import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pg");
      config.externals.push("@prisma/adapter-pg");
    }
    return config;
  },
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
