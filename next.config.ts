import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output bundles only what's needed — ideal for Docker
  // creates a self-contained server in .next/standalone/server.js
  output: "standalone",

  serverExternalPackages: ["@google/genai", "@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
};

export default nextConfig;
