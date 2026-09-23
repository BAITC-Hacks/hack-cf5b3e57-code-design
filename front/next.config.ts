import type { NextConfig } from "next";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

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
  turbopack: {
    // The shared API contract lives next to front/, so it must be inside the
    // resolver root for both development and production builds.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
