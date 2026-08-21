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
  async redirects() {
    return [
      // Arama motorunda indekslenmiş eski demo adresi → yayındaki demo menü (kalıcı 301)
      {
        source: "/m/deneme-deneme",
        destination: "/m/karadenizgurme",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
