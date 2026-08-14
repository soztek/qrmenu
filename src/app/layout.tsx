import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { COMPANY } from "@/lib/company";
import { PLANS } from "@/lib/plans";

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
    "mutfak paneli",
    "masa yönetimi",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Söztek QR Menü — QR menüden siparişe, mutfaktan masaya tek panel",
    description:
      "İşletmeniz için dijital QR menü, masadan sipariş, canlı mutfak paneli ve masa yönetimi. 7 gün ücretsiz deneyin, kart gerekmez.",
    url: "https://www.soztekqrmenu.com.tr",
    siteName: "Söztek QR Menü",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/logo.jpg", alt: "Söztek QR Menü" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Söztek QR Menü",
    description:
      "QR menü, masadan sipariş, canlı mutfak paneli ve masa yönetimi. 7 gün ücretsiz.",
    images: ["/logo.jpg"],
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
              "@type": "Organization",
              name: COMPANY.legalName,
              alternateName: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/logo.jpg`,
              email: COMPANY.email,
              telephone: COMPANY.phoneRaw,
              address: {
                "@type": "PostalAddress",
                streetAddress: COMPANY.address,
                addressCountry: "TR",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: COMPANY.gsmRaw,
                contactType: "customer support",
                areaServed: "TR",
                availableLanguage: ["Turkish"],
              },
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
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "TRY",
                lowPrice: String(Math.min(...PLANS.map((p) => p.priceMonthly))),
                highPrice: String(Math.max(...PLANS.map((p) => p.priceMonthly))),
                offerCount: String(PLANS.length),
                description: "Aylık abonelik · 7 gün ücretsiz deneme",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
