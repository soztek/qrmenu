import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.soztekqrmenu.com.tr"),
  title: {
    default: "Söztek QR Menü — İşletmeniz için dijital QR menü",
    template: "%s · Söztek QR Menü",
  },
  description:
    "Kafe, restoran ve tüm işletmeler için QR menü, sipariş, mutfak paneli ve masa yönetimi. Dakikalar içinde kurun, 7 gün ücretsiz deneyin.",
  keywords: [
    "qr menü",
    "dijital menü",
    "restoran menü",
    "kafe menü",
    "qr sipariş",
    "sipariş yönetimi",
  ],
  openGraph: {
    title: "Söztek QR Menü",
    description:
      "İşletmeniz için dijital QR menü, sipariş ve masa yönetimi. 7 gün ücretsiz deneyin.",
    url: "https://www.soztekqrmenu.com.tr",
    siteName: "Söztek QR Menü",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              description:
                "Kafe, restoran ve tüm işletmeler için QR menü, sipariş ve masa yönetimi.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: SITE_URL,
              offers: { "@type": "Offer", price: "0", priceCurrency: "TRY", description: "7 gün ücretsiz deneme" },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
