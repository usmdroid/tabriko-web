"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fetchModeration,
  resolveReport,
  dismissReport,
  ModerationItem,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const STATUS_BADGE: Record<ModerationItem["status"], string> = {
  OPEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DISMISSED: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function AdminModerationPage() {
  const t = useTranslations("adminModeration");

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchModeration());
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(item: ModerationItem) {
    setBusy((b) => ({ ...b, [`${item.id}-resolve`]: true }));
    try {
      await resolveReport(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "RESOLVED" } : i)),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [`${item.id}-resolve`]: false }));
    }
  }

  async function handleDismiss(item: ModerationItem) {
    setBusy((b) => ({ ...b, [`${item.id}-dismiss`]: true }));
    try {
      await dismissReport(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "DISMISSED" } : i)),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [`${item.id}-dismiss`]: false }));
    }
  }

  const openCount = items.filter((i) => i.status === "OPEN").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">{t("pageTitle")}</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center py-16 text-muted">
          <CheckCircle size={32} className="mb-3 text-green-500" />
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="text-xs mt-1">{t("emptyDesc")}</p>
        </div>
      )}

      {!loading && items.length > 0 && openCount === 0 && (
        <p className="mb-4 text-sm text-muted">{t("allReviewed")}</p>
      )}

      {(loading || items.length > 0) && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">{t("colType")}</th>
                  <th className="px-4 py-3 font-medium">{t("colTarget")}</th>
                  <th className="px-4 py-3 font-medium">{t("colReason")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-line">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted capitalize">{item.targetType}</td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">
                        {String(item.targetId).slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[180px] truncate">{item.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                          {t(`status${item.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.createdAt}</td>
                      <td className="px-4 py-3">
                        {item.status === "OPEN" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResolve(item)}
                              disabled={busy[`${item.id}-resolve`]}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                            >
                              {busy[`${item.id}-resolve`] ? (
                                <Spinner size={11} />
                              ) : (
                                <CheckCircle size={11} />
                              )}
                              {t("actionResolve")}
                            </button>
                            <button
                              onClick={() => handleDismiss(item)}
                              disabled={busy[`${item.id}-dismiss`]}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              {busy[`${item.id}-dismiss`] ? (
                                <Spinner size={11} />
                              ) : (
                                <XCircle size={11} />
                              )}
                              {t("actionDismiss")}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
