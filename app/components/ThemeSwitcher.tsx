"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("theme");

  const options = [
    { value: "light", Icon: Sun, label: t("light") },
    { value: "dark", Icon: Moon, label: t("dark") },
    { value: "system", Icon: Monitor, label: t("system") },
  ];

  return (
    <div className={`flex items-center gap-0.5 rounded-lg border border-line bg-bg p-0.5 transition-opacity ${resolvedTheme === undefined ? "opacity-0 pointer-events-none" : ""}`}>
      {options.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          aria-label={label}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            theme === value
              ? "bg-accent text-white"
              : "text-muted hover:text-primary"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
