import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob'a yüklenen ürün fotoğrafları için (next/image)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
