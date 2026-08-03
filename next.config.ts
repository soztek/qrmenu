import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzico artık SDK yerine doğrudan REST (fetch) ile çağrılıyor (src/lib/iyzico.ts);
  // iyzipay paketine bağımlılık kalmadı.
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
