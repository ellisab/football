import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { ALLOWED_IMAGE_REMOTE_PATTERNS } from "../../packages/core/src/teams/allowed-image-hosts";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(projectRoot, "..", "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  transpilePackages: ["@footballleagues/core", "@footballleagues/ui"],
  experimental: {
    externalDir: true,
    optimizePackageImports: ["lucide-react"],
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "https://localhost:3000",
    "localhost",
  ],
  images: {
    remotePatterns: ALLOWED_IMAGE_REMOTE_PATTERNS,
  },
};

export default nextConfig;
