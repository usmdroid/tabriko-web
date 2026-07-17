import { ReactNode } from "react";

interface InfoGridProps {
  children: ReactNode;
}

export function InfoGrid({ children }: InfoGridProps) {
  return (
    <div className="surface-card p-5 mb-4">
      <div className="grid grid-cols-2 gap-3 text-sm">{children}</div>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value?: string | number | null;
  children?: ReactNode;
}

export function InfoField({ label, value, children }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      {children ?? (
        <p className="font-medium text-primary">{value != null && value !== "" ? value : "—"}</p>
      )}
    </div>
  );
}
