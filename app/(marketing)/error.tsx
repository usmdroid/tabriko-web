"use client";

import { useTranslations } from "next-intl";

export default function MarketingRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-sm text-red-500">{t("error")}</p>
      <button
        onClick={reset}
        className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent transition-colors"
      >
        {t("retry")}
      </button>
    </div>
  );
}
