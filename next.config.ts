import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // iyzipay dinamik require kullanıyor; bundle etme, runtime'da node_modules'tan yükle.
  serverExternalPackages: ["iyzipay"],
  // iyzipay lib/Iyzipay.js dinamik require ile resources/requests yükler; dosya
  // izleyici bunları takip edemediğinden ödeme route'larına açıkça dahil et
  // (yoksa Vercel serverless fonksiyonunda dosyalar eksik → runtime 500).
  outputFileTracingIncludes: {
    "/dashboard/abonelik/odeme": ["./node_modules/iyzipay/**/*"],
    "/api/iyzico/callback": ["./node_modules/iyzipay/**/*"],
  },
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
