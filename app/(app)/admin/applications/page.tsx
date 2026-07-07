"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  getSession,
  fetchApplications,
  AdminApplicationListItem,
  AdminApplicationStatus,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";

const ALL_STATUSES: Array<{ key: AdminApplicationStatus | "ALL"; labelKey: string }> = [
  { key: "ALL", labelKey: "all" },
  { key: "SUBMITTED", labelKey: "statusSUBMITTED" },
  { key: "UNDER_REVIEW", labelKey: "statusUNDER_REVIEW" },
  { key: "INFO_REQUESTED", labelKey: "statusINFO_REQUESTED" },
  { key: "APPROVED", labelKey: "statusAPPROVED" },
  { key: "REJECTED", labelKey: "statusREJECTED" },
];

const STATUS_COLORS: Record<AdminApplicationStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  UNDER_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  INFO_REQUESTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminApplicationsPage() {
  const t = useTranslations("adminApplications");
  const session = useMemo(() => getSession(), []);

  const [filter, setFilter] = useState<AdminApplicationStatus | "ALL">("ALL");
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const status = filter === "ALL" ? undefined : filter;
      setItems(await fetchApplications(session.token, status));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [session, filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">{t("pageTitle")}</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_STATUSES.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-accent text-white"
                : "border border-line bg-surface text-muted hover:border-accent/50 hover:text-accent"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">{t("colName")}</th>
                <th className="px-4 py-3 font-medium">{t("colPhone")}</th>
                <th className="px-4 py-3 font-medium">{t("colActivity")}</th>
                <th className="px-4 py-3 font-medium">{t("colSocial")}</th>
                <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    {t("notFound")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary">
                      <Link
                        href={`/admin/applications/${item.id}`}
                        className="hover:text-accent transition-colors"
                      >
                        {item.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.phone}</td>
                    <td className="px-4 py-3 text-muted">
                      {item.categoryName ?? item.otherText ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.socialType ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                        {t(`status${item.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {item.createdAt ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
