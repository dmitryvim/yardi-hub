import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["yardi.local.dmitrylabs.com", "dng.me"],
};

export default nextConfig;
