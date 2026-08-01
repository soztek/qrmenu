import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay dinamik require kullanıyor; bundle etme, runtime'da node_modules'tan yükle.
  serverExternalPackages: ["iyzipay"],
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
