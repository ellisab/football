import type { NextConfig } from "next";
import { ALLOWED_IMAGE_REMOTE_PATTERNS } from "./packages/core/src/teams/allowed-image-hosts";

const nextConfig: NextConfig = {
  transpilePackages: ["@footballleagues/core", "@footballleagues/ui"],
  experimental: {
    useTypeScriptCli: true,
  },
  images: {
    remotePatterns: ALLOWED_IMAGE_REMOTE_PATTERNS,
  },
};

export default nextConfig;
