import type { NextConfig } from "next";

/**
 * Jitsi ships ESM/React components that must be transpiled for the Next.js bundler.
 * pdf-parse / mammoth run only on the server in our API route; marking them external
 * avoids noisy bundler warnings during `next build`.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@jitsi/react-sdk"],
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
