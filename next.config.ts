import type { NextConfig } from "next";
import { ALLOWED_IMAGE_REMOTE_PATTERNS } from "./packages/core/src/teams/allowed-image-hosts";

const nextConfig: NextConfig = {
  transpilePackages: ["@footballleagues/core", "@footballleagues/ui"],
  typescript: {
    // `pnpm run build` runs the TypeScript 7 CLI before Next.js compiles.
    // Next.js still needs the TypeScript 6 API for setup until TypeScript 7.1.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: ALLOWED_IMAGE_REMOTE_PATTERNS,
  },
};

export default nextConfig;
