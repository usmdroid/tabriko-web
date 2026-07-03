import Link from "next/link";
import { BRAND, BRAND_EMAIL } from "@/lib/brand";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

function BrandLogo() {
  const name = BRAND;
  const split = name.length - 1;
  return (
    <>
      {name.slice(0, split)}
      <span className="text-accent">{name.slice(split)}</span>
    </>
  );
}

async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/#qanday" className="nav-link hover:text-accent transition-colors">{t("qanday")}</Link>
          <Link href="/#creatorlar" className="nav-link hover:text-accent transition-colors">{t("creatorlar")}</Link>
          <Link href="/#savollar" className="nav-link hover:text-accent transition-colors">{t("savollar")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

async function Footer() {
  const t = await getTranslations("marketing");
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
        <div className="font-semibold text-primary">
          <BrandLogo />
        </div>
        <div>{BRAND} · {new Date().getFullYear()} · {t("footerTagline")}</div>
        <a href={`mailto:${BRAND_EMAIL}`} className="hover:text-primary transition-colors">{BRAND_EMAIL}</a>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
