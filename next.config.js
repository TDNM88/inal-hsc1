/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration from next.config.mjs
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuration from next.config.js
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://inal-hsc-api.vercel.app/api/:path*'
          : 'http://localhost:3000/api/:path*'
      },
      {
        source: '/ws/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://inal-hsc-api.vercel.app/:path*'
          : 'http://localhost:3000/:path*'
      }
    ];
  },
};

export default nextConfig;
