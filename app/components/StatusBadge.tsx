interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  blockedLabel?: string;
}

export function StatusBadge({ active, activeLabel = "Faol", blockedLabel = "Bloklangan" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {active ? activeLabel : blockedLabel}
    </span>
  );
}
