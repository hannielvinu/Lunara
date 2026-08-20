import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/data/:path*",
        destination: "http://127.0.0.1:8000/data/:path*",
      },
      {
        source: "/static_output/:path*",
        destination: "http://127.0.0.1:8000/static_output/:path*",
      },
      {
        source: "/demo_results/:path*",
        destination: "http://127.0.0.1:8000/demo_results/:path*",
      },
    ];
  },
};

export default nextConfig;
