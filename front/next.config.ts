import type { NextConfig } from "next";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const sharedDirectory = path.resolve(__dirname, "..", "shared");

const contractorImagesDirectory = path.resolve(
  __dirname,
  "public",
  "contractors",
);
const contractorImageIds = existsSync(contractorImagesDirectory)
  ? readdirSync(contractorImagesDirectory)
      .filter((fileName) => /^HK-\d{5}\.webp$/i.test(fileName))
      .map((fileName) => fileName.slice(0, -".webp".length))
      .sort()
  : [];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONTRACTOR_IMAGE_IDS: contractorImageIds.join(","),
  },
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  turbopack: {
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      "@shared": sharedDirectory,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@shared": sharedDirectory,
    };
    return config;
  },
};

export default nextConfig;
