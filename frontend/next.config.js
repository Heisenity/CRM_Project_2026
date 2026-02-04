/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://crm-backend:3000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
