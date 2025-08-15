import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   async rewrites() {
    return [
      {
        source: '/analytics/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analytics/:path*`,
      },
    ];
  },
};

export default nextConfig;