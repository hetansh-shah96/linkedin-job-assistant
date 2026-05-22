/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = config.externals ?? []
      config.externals = [
        ...(Array.isArray(existing) ? existing : [existing]),
        'pdf-parse',
        'mammoth',
      ]
    }
    return config
  },
}
module.exports = nextConfig
