"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, RotateCcw } from "lucide-react";
import {
  fetchDeletedAccounts,
  restoreAccount,
  DeletedAccount,
} from "@/lib/admin-api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

export default function DeletedAccountsPage() {
  const t = useTranslations("adminDeleted");
  const [rows, setRows] = useState<DeletedAccount[] | null>(null);
  const [error, setError] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setRows(await fetchDeletedAccounts());
    } catch {
      setError(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRestore(id: string) {
    if (!confirm(t("restoreConfirm"))) return;
    setRestoringId(id);
    try {
      await restoreAccount(id);
      await load();
    } catch {
      alert(t("actionFailed"));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-primary">{t("title")}</h1>
        <button
          type="button"
          onClick={load}
          title={t("reload")}
          aria-label={t("reload")}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-accent/50 hover:text-accent transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <p className="text-sm text-muted mb-4">{t("subtitle")}</p>

      {rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-muted">{t("loadFailed")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-4 py-3 font-medium">{t("colName")}</th>
                <th className="px-4 py-3 font-medium">{t("colRole")}</th>
                <th className="px-4 py-3 font-medium">{t("colPhone")}</th>
                <th className="px-4 py-3 font-medium">{t("colDeletedAt")}</th>
                <th className="px-4 py-3 font-medium">{t("colDeletedBy")}</th>
                <th className="px-4 py-3 font-medium">{t("colReason")}</th>
                <th className="px-4 py-3 font-medium text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.role}</td>
                  <td className="px-4 py-3 text-muted">{r.phone}</td>
                  <td className="px-4 py-3 text-muted">{r.deletedAt}</td>
                  <td className="px-4 py-3 text-muted">{r.deletedByName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted max-w-xs truncate" title={r.reason ?? ""}>
                    {r.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRestore(r.id)}
                      disabled={restoringId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-40"
                    >
                      {restoringId === r.id ? <Spinner size={13} /> : <RotateCcw size={13} />}
                      {t("restoreBtn")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
