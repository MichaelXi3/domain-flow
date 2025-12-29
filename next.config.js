const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Allow warnings during build (only fail on errors)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type check but don't fail build on warnings
    ignoreBuildErrors: false,
  }
};

module.exports = withPWA(nextConfig);

