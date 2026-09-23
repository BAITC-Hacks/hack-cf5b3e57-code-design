import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const sharedDir = path.resolve(__dirname, "..", "shared");

const contractorImagesDirectory = path.resolve(__dirname, "public", "contractors");
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
  // shared/ лежит рядом с front/, поэтому корень трассировки и резолвера — на уровень выше.
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  turbopack: {
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      "@shared": sharedDir,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@shared": sharedDir,
    };
    return config;
  },
};

export default nextConfig;