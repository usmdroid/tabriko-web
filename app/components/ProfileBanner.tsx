import { ReactNode } from "react";

interface ProfileBannerProps {
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  name: string;
  subtitle?: string;
  badges?: ReactNode;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileBanner({ bannerUrl, avatarUrl, name, subtitle, badges }: ProfileBannerProps) {
  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-line">
      {/* Banner */}
      <div className="relative aspect-video w-full bg-card">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-surface" />
        )}

        {/* Avatar pinned to bottom-left, overlapping banner bottom edge */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-background shadow-md bg-accent flex items-center justify-center text-white text-xl font-bold select-none">
              {initials(name)}
            </div>
          )}
        </div>
      </div>

      {/* Name / subtitle / badges row — leave space for overlapping avatar */}
      <div className="pt-12 pb-4 px-5">
        <p className="text-lg font-semibold text-primary leading-tight">{name}</p>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        {badges && <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>}
      </div>
    </div>
  );
}
