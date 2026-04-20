import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hero images are written to ./uploads (gitignored, mounted volume in
  // Docker) and served through /api/uploads so they live outside /public.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
