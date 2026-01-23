/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize firebase-admin for server-side only
      config.externals = config.externals || [];
      config.externals.push('firebase-admin');
    }
    return config;
  },
  // For Turbopack, use serverExternalPackages
  serverExternalPackages: ['firebase-admin'],
}

module.exports = nextConfig 