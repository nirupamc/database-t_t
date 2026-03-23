import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Force fresh deployment - cache bust
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
