"use client";

import { Skeleton } from "@/app/components/Skeleton";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** td className; defaults to the muted cell style. */
  className?: string;
}

interface ResourceTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading: boolean;
  emptyText: string;
  rowKey: (row: T) => React.Key;
  skeletonRows?: number;
  skeletonCellClassName?: string;
  rowClassName?: (row: T) => string;
  /** Optional header bar rendered inside the card (used by categories). */
  header?: React.ReactNode;
  cardClassName?: string;
}

const DEFAULT_ROW =
  "border-b border-line last:border-0 hover:bg-card/50 transition-colors";

export function ResourceTable<T>({
  columns,
  rows,
  loading,
  emptyText,
  rowKey,
  skeletonRows = 3,
  skeletonCellClassName = "h-4 w-20",
  rowClassName,
  header,
  cardClassName = "",
}: ResourceTableProps<T>) {
  return (
    <div className={`surface-card overflow-hidden ${cardClassName}`}>
      {header}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-line">
                  {columns.map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className={skeletonCellClassName} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-muted text-xs"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className={rowClassName ? rowClassName(row) : DEFAULT_ROW}>
                  {columns.map((col, j) => (
                    <td key={j} className={col.className ?? "px-4 py-3 text-muted"}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
