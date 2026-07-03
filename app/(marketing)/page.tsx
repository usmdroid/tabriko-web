import type { Metadata } from "next";
import { BRAND, BRAND_TAGLINE } from "@/lib/brand";
import uz from "@/locales/uz.json";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: { absolute: `${BRAND} — ${BRAND_TAGLINE}` },
};

const m = uz.marketing;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { q: m.faq0Q, a: m.faq0A },
    { q: m.faq1Q, a: m.faq1A },
    { q: m.faq2Q, a: m.faq2A },
    { q: m.faq3Q, a: m.faq3A },
    { q: m.faq4Q, a: m.faq4A },
  ].map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingClient />
    </>
  );
}
