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
  webpack: (config, { isServer }) => {
    // Đảm bảo React được tải trước
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: 'react',
        'react-dom': 'react-dom',
      };
    }
    return config;
  },
  // Configuration for API rewrites
  async rewrites() {
    return [
      // Only proxy specific API routes to the external API
      {
        source: '/api/game/:path*',
        destination: 'https://inal-hsc-api.vercel.app/api/game/:path*'
      },
      {
        source: '/ws/:path*',
        destination: 'https://inal-hsc-api.vercel.app/:path*'
      }
    ];
  },
};

export default nextConfig;
