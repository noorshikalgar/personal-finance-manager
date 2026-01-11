import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- This is required for the Dockerfile above
  // experimental: { turbopack: true } // If you are using Turbopack
};

export default nextConfig;