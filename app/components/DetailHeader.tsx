import { ReactNode } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Spinner } from "@/app/components/Spinner";

interface DetailHeaderProps {
  title?: string;
  badges?: ReactNode;
  onReload: () => void;
  loading: boolean;
  reloadLabel?: string;
  backHref: string;
  backLabel?: string;
  avatarUrl?: string | null;
}

export function DetailHeader({
  title,
  badges,
  onReload,
  loading,
  reloadLabel = "Yangilash",
  backHref,
  backLabel = "← Orqaga",
  avatarUrl,
}: DetailHeaderProps) {
  return (
    <>
      <Link
        href={backHref}
        className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
      >
        {backLabel}
      </Link>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
          />
        ) : (
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-full border border-line shrink-0 bg-surface flex items-center justify-center text-sm font-semibold text-muted select-none"
          >
            {title ? title.trim().charAt(0).toUpperCase() : "?"}
          </span>
        )}
        {title && <h1 className="text-xl font-semibold text-primary">{title}</h1>}
        {badges}
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          title={reloadLabel}
          aria-label={reloadLabel}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-40"
        >
          {loading ? <Spinner size={15} /> : <RefreshCw size={15} />}
        </button>
      </div>
    </>
  );
}
