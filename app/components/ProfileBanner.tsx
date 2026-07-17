import { ReactNode } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

interface ProfileBannerProps {
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  name: string;
  subtitle?: string;
  badges?: ReactNode;
  // Moderation: delete image overlays (SUPERADMIN only)
  canDeleteImages?: boolean;
  onDeleteAvatar?: () => void;
  onDeleteBanner?: () => void;
  // Moderation: warn button next to name (SUPERADMIN or MODERATOR)
  canWarn?: boolean;
  onWarnName?: () => void;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileBanner({
  bannerUrl,
  avatarUrl,
  name,
  subtitle,
  badges,
  canDeleteImages,
  onDeleteAvatar,
  onDeleteBanner,
  canWarn,
  onWarnName,
}: ProfileBannerProps) {
  const showBannerDelete = canDeleteImages && !!onDeleteBanner;
  const showAvatarDelete = canDeleteImages && !!onDeleteAvatar;
  const showNameWarn = canWarn && !!onWarnName;

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-line">
      {/* Banner */}
      <div className="relative aspect-video w-full bg-card group">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card to-surface" />
        )}

        {showBannerDelete && (
          <button
            type="button"
            onClick={onDeleteBanner}
            title="Muqovani o'chirish"
            aria-label="Muqovani o'chirish"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Trash2 size={28} className="text-white drop-shadow" />
          </button>
        )}

        {/* Avatar pinned to bottom-left, overlapping banner bottom edge */}
        <div className="absolute bottom-0 left-4 translate-y-1/2 group/avatar">
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
          {showAvatarDelete && (
            <button
              type="button"
              onClick={onDeleteAvatar}
              title="Rasmni o'chirish"
              aria-label="Rasmni o'chirish"
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
            >
              <Trash2 size={18} className="text-white drop-shadow" />
            </button>
          )}
        </div>
      </div>

      {/* Name / subtitle / badges row — leave space for overlapping avatar */}
      <div className="pt-12 pb-4 px-5">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-primary leading-tight">{name}</p>
          {showNameWarn && (
            <button
              type="button"
              onClick={onWarnName}
              title="Ogohlantirish yuborish"
              aria-label="Ogohlantirish yuborish"
              className="inline-flex items-center justify-center w-6 h-6 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors shrink-0"
            >
              <AlertTriangle size={15} />
            </button>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        {badges && <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>}
      </div>
    </div>
  );
}
