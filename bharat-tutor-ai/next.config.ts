import type { NextConfig } from "next";

/**
 * pdf-parse / mammoth run only on the server in our API route; marking them external
 * avoids noisy bundler warnings during `next build`.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
