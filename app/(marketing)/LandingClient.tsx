"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Star, Zap, DollarSign, Heart } from "lucide-react";
import Reveal from "@/app/components/Reveal";
import CountUp from "@/app/components/CountUp";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? "#";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "#";

const DEMO_CREATORS = [
  { name: "Asilbek Xolmatov", category: "Blogger", emoji: "🎬", price: "150 000" },
  { name: "Zulfiya Nazarova", category: "Qo'shiqchi", emoji: "🎤", price: "200 000" },
  { name: "Jahongir Mavlonov", category: "Sportchi", emoji: "⚽", price: "100 000" },
  { name: "Dildora Niyozova", category: "Aktyor", emoji: "🎭", price: "180 000" },
  { name: "Bobur Yusupov", category: "Yumorist", emoji: "😂", price: "120 000" },
  { name: "Sarvar Ergashev", category: "Blogger", emoji: "📱", price: "90 000" },
];

const CATEGORIES = [
  "categoryBloggers",
  "categorySingers",
  "categoryActors",
  "categoryAthletes",
  "categoryComedians",
  "categoryBusiness",
] as const;

function AppStoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.28-2.16 3.81.03 3.02 2.65 4.03 2.68 4.04l-.07.27zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.18 23.76c.3.17.64.24.99.21l12.32-9.36-2.9-2.9L3.18 23.76zM.71 1.15C.27 1.59 0 2.29 0 3.16v17.69c0 .87.27 1.57.71 2.01l.1.1 9.9-9.9v-.23L.81 1.05l-.1.1zM20.65 10.35l-2.83-1.63-3.17 3.17 3.17 3.17 2.85-1.64c.81-.47.81-1.22-.02-1.07zM4.17.24l12.32 9.35-2.9 2.9L3.18.24c.3-.17.64-.24.99-.21z" />
    </svg>
  );
}

export default function LandingClient() {
  const t = useTranslations("marketing");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("categoryBloggers");

  const steps = [
    { n: "1", title: t("step0Title"), text: t("step0Text") },
    { n: "2", title: t("step1Title"), text: t("step1Text") },
    { n: "3", title: t("step2Title"), text: t("step2Text") },
  ];

  const whyItems = [
    { Icon: Heart,       title: t("why0Title"), text: t("why0Text") },
    { Icon: DollarSign,  title: t("why1Title"), text: t("why1Text") },
    { Icon: Star,        title: t("why2Title"), text: t("why2Text") },
    { Icon: Zap,         title: t("why3Title"), text: t("why3Text") },
  ];

  const faqItems = [
    { q: t("faq0Q"), a: t("faq0A") },
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Radial gradient glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute top-20 right-0 h-[300px] w-[300px] rounded-full bg-accent2/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full bg-accent/10 blur-[80px]" />
        </div>

        <section className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-20 text-center sm:pt-32">
          <span
            className="anim-fade-up inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-medium uppercase tracking-wider text-accent"
            style={{ animationDelay: "60ms" }}
          >
            {t("heroBadge")}
          </span>

          <h1
            className="anim-fade-up mt-6 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
            style={{ animationDelay: "160ms" }}
          >
            <span className="gradient-text">{t("heroHeading")}</span>
          </h1>

          <p
            className="anim-fade-up mt-4 text-lg font-medium text-muted"
            style={{ animationDelay: "240ms" }}
          >
            {t("heroTagline")}
          </p>

          <p
            className="anim-fade-up mx-auto mt-4 max-w-2xl text-base text-muted"
            style={{ animationDelay: "300ms" }}
          >
            {t("heroDesc")}
          </p>

          <div
            className="anim-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ animationDelay: "420ms" }}
          >
            <a
              href={APP_STORE_URL}
              className="btn-neon flex items-center gap-2.5 rounded-full px-6 py-3 font-semibold text-white"
            >
              <AppStoreIcon />
              {t("heroCtaAppStore")}
            </a>
            <a
              href={PLAY_STORE_URL}
              className="btn-shine flex items-center gap-2.5 rounded-full border border-accent/50 bg-surface px-6 py-3 font-semibold text-primary transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_6px_18px_rgba(124,58,237,0.2)]"
            >
              <PlayStoreIcon />
              {t("heroCtaPlayStore")}
            </a>
          </div>
        </section>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="border-t border-line py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-8">
            {[
              { end: 500,   suffix: "+", label: t("statsCreatorsLabel") },
              { end: 10000, suffix: "+", label: t("statsGreetingsLabel") },
              { end: 98,    suffix: "%", label: t("statsHappyLabel") },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="text-center">
                  <p className="font-serif text-4xl font-bold gradient-text">
                    <CountUp end={s.end} />
                    {s.suffix}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="qanday" className="border-t border-line gradient-bg py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-primary">
              {t("howHeading")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="group text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_6px_30px_rgba(124,58,237,0.6)] btn-neon">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-primary">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creators ─────────────────────────────────────────────────── */}
      <section id="creatorlar" className="border-t border-line py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-primary">
              {t("creatorsHeading")}
            </h2>
            <p className="mt-2 text-center text-muted">{t("creatorsDesc")}</p>
          </Reveal>

          {/* Category tabs */}
          <Reveal delay={80}>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-accent text-white shadow-[0_4px_12px_rgba(124,58,237,0.4)]"
                      : "border border-line bg-surface text-muted hover:border-accent/60 hover:text-accent"
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Creator cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_CREATORS.map((c, i) => (
              <Reveal key={c.name} delay={i * 70}>
                <div className="group cursor-pointer rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_4px_rgba(26,14,46,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_12px_32px_rgba(124,58,237,0.14)]">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-card text-3xl transition-transform duration-300 group-hover:scale-110">
                      {c.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-primary">{c.name}</p>
                      <p className="text-sm text-muted">{c.category}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-accent fill-accent" />
                      <span className="text-xs text-muted">4.9</span>
                    </div>
                    <span className="text-sm font-semibold text-accent">
                      {c.price} so&apos;m
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why TabrikO ──────────────────────────────────────────────── */}
      <section className="border-t border-line gradient-bg py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-primary">
              {t("whyHeading")}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="group h-full rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_4px_rgba(26,14,46,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_12px_32px_rgba(124,58,237,0.14)]">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-primary">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="savollar" className="border-t border-line py-20">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-primary">
              {t("faqHeading")}
            </h2>
          </Reveal>
          <div className="mt-10 space-y-2">
            {faqItems.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={i} delay={i * 60}>
                  <div className="overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent/40">
                    <button
                      className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-primary transition-colors hover:text-accent"
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180 text-accent" : ""}`}
                      />
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-line py-20">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl px-8 py-16 text-center">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 via-transparent to-accent2/10" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-accent/25 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <Reveal>
              <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="gradient-text">{t("ctaHeading")}</span>
              </h2>
              <p className="mt-4 text-muted">{t("ctaDesc")}</p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={APP_STORE_URL}
                  className="btn-neon flex items-center gap-2.5 rounded-full px-7 py-3.5 font-semibold text-white text-lg"
                >
                  <AppStoreIcon />
                  {t("ctaAppStore")}
                </a>
                <a
                  href={PLAY_STORE_URL}
                  className="btn-shine flex items-center gap-2.5 rounded-full border border-accent/50 bg-surface px-7 py-3.5 font-semibold text-primary text-lg transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_6px_20px_rgba(124,58,237,0.22)]"
                >
                  <PlayStoreIcon />
                  {t("ctaPlayStore")}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
