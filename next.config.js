/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true'
const repoName = 'mission-control'

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  assetPrefix: isGhPages ? `/${repoName}/` : undefined,
  basePath: isGhPages ? `/${repoName}` : undefined,
  // Rewrites only work with 'next start' or custom server, ignored in 'export'
  // But we keep it here for documentation of the VPS logic
  async rewrites() {
    return [
      {
        source: '/mc/:path*',
        destination: 'http://127.0.0.1:8899/mc/:path*',
      },
    ]
  },
}

module.exports = nextConfig
