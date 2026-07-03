"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, EyeOff } from "lucide-react";
import {
  getSession,
  fetchModeration,
  approveModeration,
  hideModeration,
  ModerationItem,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const STATUS_BADGE: Record<ModerationItem["status"], string> = {
  flagged: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  under_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const STATUS_LABEL: Record<ModerationItem["status"], string> = {
  flagged: "Belgilangan",
  under_review: "Ko'rib chiqilmoqda",
};

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const session = getSession();

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setItems(await fetchModeration(session.token));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(item: ModerationItem) {
    if (!session) return;
    setBusy((b) => ({ ...b, [`${item.id}-approve`]: true }));
    try {
      await approveModeration(session.token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [`${item.id}-approve`]: false }));
    }
  }

  async function handleHide(item: ModerationItem) {
    if (!session) return;
    setBusy((b) => ({ ...b, [`${item.id}-hide`]: true }));
    try {
      await hideModeration(session.token, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [`${item.id}-hide`]: false }));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">Moderatsiya</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center py-16 text-muted">
          <CheckCircle size={32} className="mb-3 text-green-500" />
          <p className="text-sm font-medium">Moderatsiya uchun element yo&apos;q</p>
          <p className="text-xs mt-1">Barcha tabriklar ko&apos;rib chiqilgan</p>
        </div>
      )}

      {(loading || items.length > 0) && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Kreator</th>
                  <th className="px-4 py-3 font-medium">Tur</th>
                  <th className="px-4 py-3 font-medium">Sabab</th>
                  <th className="px-4 py-3 font-medium">Holati</th>
                  <th className="px-4 py-3 font-medium">Sana</th>
                  <th className="px-4 py-3 font-medium">Amallar</th>
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
                      <td className="px-4 py-3 font-medium text-primary">{item.creatorName}</td>
                      <td className="px-4 py-3 text-muted capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-muted max-w-[180px] truncate">{item.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{item.createdAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={busy[`${item.id}-approve`]}
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                          >
                            {busy[`${item.id}-approve`] ? (
                              <Spinner size={11} />
                            ) : (
                              <CheckCircle size={11} />
                            )}
                            Tasdiqlash
                          </button>
                          <button
                            onClick={() => handleHide(item)}
                            disabled={busy[`${item.id}-hide`]}
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {busy[`${item.id}-hide`] ? (
                              <Spinner size={11} />
                            ) : (
                              <EyeOff size={11} />
                            )}
                            Yashirish
                          </button>
                        </div>
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
