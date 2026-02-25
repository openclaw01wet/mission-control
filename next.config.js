/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Optimized for Docker/Self-hosting
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/mc/:path*',
        destination: 'http://127.0.0.1:8899/mc/:path*', // Proxy to Engine
      },
    ]
  },
}

module.exports = nextConfig
