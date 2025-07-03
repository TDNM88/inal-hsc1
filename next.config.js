/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép truy cập cross-origin từ ngrok và các địa chỉ IP local
  experimental: {
    allowedDevOrigins: ["localhost", "192.168.1.4", "*"]
  },
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
        destination: 'https://inal-hsc-api.vercel.app/api/:path*'
      },
      {
        source: '/ws/:path*',
        destination: 'https://inal-hsc-api.vercel.app/:path*'
      }
    ];
  },
};

export default nextConfig;
