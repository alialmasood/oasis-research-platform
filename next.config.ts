import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ابقِ Prisma خارج حزمة Webpack حتى يُحمَّل العميل المُولَّد من node_modules بعد prisma generate
  serverExternalPackages: ["@prisma/client", ".prisma/client", "pg", "@prisma/adapter-pg"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pg");
      config.externals.push("@prisma/adapter-pg");
      config.externals.push("@prisma/client");
      config.externals.push(".prisma/client");
    }
    return config;
  },
  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
