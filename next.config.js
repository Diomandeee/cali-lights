/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Make Sentry optional - don't fail build if not installed
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@sentry/nextjs': 'commonjs @sentry/nextjs',
      });
    }
    return config;
  },
}

module.exports = nextConfig
