/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true'
const repoName = 'mission-control'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  assetPrefix: isGhPages ? `/${repoName}/` : undefined,
  basePath: isGhPages ? `/${repoName}` : undefined,
}

module.exports = nextConfig
