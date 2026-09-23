import path from 'node:path';
import type { NextConfig } from 'next';

const sharedDir = path.resolve(__dirname, '..', 'shared');

const nextConfig: NextConfig = {
  // Разрешаем Next читать shared/ выше по дереву (иначе Turbopack блокирует
  // импорты за пределы front/).
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  turbopack: {
    resolveAlias: {
      '@shared': sharedDir,
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@shared': sharedDir,
    };
    return config;
  },
};

export default nextConfig;
