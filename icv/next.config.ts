import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Externalize firebase-admin for server-side only (works with both webpack and Turbopack)
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
