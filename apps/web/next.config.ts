import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

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
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "www.bundesliga-reisefuehrer.de" },
      { protocol: "https", hostname: "bundesliga-reisefuehrer.de" },
      { protocol: "https", hostname: "www.bundesliga-logos.com" },
      { protocol: "https", hostname: "www.bundesliga.com" },
      { protocol: "https", hostname: "www.bundesliga.de" },
    ],
  },
};

export default nextConfig;
