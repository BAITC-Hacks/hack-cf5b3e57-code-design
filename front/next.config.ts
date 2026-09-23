import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // The shared API contract lives next to front/, so it must be inside the
    // resolver root for both development and production builds.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
