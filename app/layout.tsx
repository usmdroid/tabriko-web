import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { BRAND, BRAND_EMAIL, BRAND_TAGLINE } from "@/lib/brand";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const DESCRIPTION =
  "Sevimli yulduzdan shaxsiy video tabrik buyurtma qiling. Blogerlar, qo'shiqchilar, sportchilar — 500+ creator.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tabriko.uz"),
  title: {
    template: `%s | ${BRAND}`,
    default: `${BRAND} — ${BRAND_TAGLINE}`,
  },
  description: DESCRIPTION,
  keywords: [
    "video tabrik",
    "shaxsiy tabrik",
    "yulduzdan tabrik",
    "celebrity greeting",
    "personalized video",
    "tabrik platformasi",
    BRAND,
  ],
  openGraph: {
    title: `${BRAND} — ${BRAND_TAGLINE}`,
    description: DESCRIPTION,
    url: "/",
    siteName: BRAND,
    locale: "uz_UZ",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${BRAND} — ${BRAND_TAGLINE}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND} — ${BRAND_TAGLINE}`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  // Locale switching is client-side only (cookie/localStorage) and doesn't
  // change the URL, so there's no distinct per-language page to point to —
  // claiming uz/ru/en all as separate alternates would be misleading to
  // crawlers. "x-default" (this single URL serves every locale) is accurate.
  alternates: {
    languages: { "x-default": "/" },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: "https://tabriko.uz",
  logo: "https://tabriko.uz/logo.png",
  email: BRAND_EMAIL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
