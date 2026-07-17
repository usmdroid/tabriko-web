export function WarningBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
      ⚠ Ogohlantirilgan ({count})
    </span>
  );
}

interface StatusBadgeProps {
  active: boolean;
  suspended?: boolean;
  activeLabel?: string;
  blockedLabel?: string;
  suspendedLabel?: string;
}

export function StatusBadge({
  active,
  suspended = false,
  activeLabel = "Faol",
  blockedLabel = "Bloklangan",
  suspendedLabel = "Suspend qilingan",
}: StatusBadgeProps) {
  if (active) {
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {activeLabel}
      </span>
    );
  }
  if (suspended) {
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {suspendedLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      {blockedLabel}
    </span>
  );
}
