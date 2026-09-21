import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/api/",
        "/giris",
        "/kayit",
        "/sifremi-unuttum",
        "/sifre-sifirla",
        "/ekran",
        "/yazdir",
        "/qr-yazdir",
        "/mutfak-fis",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
