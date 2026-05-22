/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist has an optional require('canvas') for Node.js use.
    // We only use it in the browser, so stub it out to prevent build errors.
    config.resolve.alias.canvas = false
    return config
  },
}
module.exports = nextConfig
