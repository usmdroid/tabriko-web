"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, Trash2, RotateCcw } from "lucide-react";
import {
  archiveAccount,
  deleteAccount,
  restoreAccount,
  getSession,
} from "@/lib/admin-api";
import { Modal } from "@/app/components/Modal";
import { Spinner } from "@/app/components/Spinner";

// Superadmin-only archive / soft-delete / restore controls, shared by the
// admin user- and creator-detail pages. Delete is enabled only once the
// account is archived, and always requires a reason.
export function AccountLifecycleActions({
  userId,
  status,
  namespace,
  onChanged,
}: {
  userId: string;
  status: string;
  namespace: "adminUsers" | "adminCreators";
  onChanged: () => void;
}) {
  const t = useTranslations(namespace);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setIsSuperadmin(getSession()?.role === "SUPERADMIN");
  }, []);

  if (!isSuperadmin) return null;

  const isArchived = status === "archived";
  const isDeleted = status === "deleted";

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch {
      alert(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onArchive() {
    if (!confirm(t("archiveConfirm"))) return;
    await run(() => archiveAccount(userId));
  }

  async function onRestore() {
    if (!confirm(t("restoreConfirm"))) return;
    await run(() => restoreAccount(userId));
  }

  async function onDeleteConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setShowDelete(false);
    await run(() => deleteAccount(userId, reason.trim()));
    setReason("");
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {!isArchived && !isDeleted && (
        <button
          type="button"
          onClick={onArchive}
          disabled={busy}
          className={`${btn} border-line text-muted hover:border-amber-500/50 hover:text-amber-500`}
        >
          {busy ? <Spinner size={14} /> : <Archive size={14} />}
          {t("archiveBtn")}
        </button>
      )}

      {isArchived && (
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          disabled={busy}
          className={`${btn} border-red-500/40 text-red-500 hover:bg-red-500/10`}
        >
          <Trash2 size={14} />
          {t("deleteBtn")}
        </button>
      )}

      {(isArchived || isDeleted) && (
        <button
          type="button"
          onClick={onRestore}
          disabled={busy}
          className={`${btn} border-line text-muted hover:border-accent/50 hover:text-accent`}
        >
          {busy ? <Spinner size={14} /> : <RotateCcw size={14} />}
          {t("restoreBtn")}
        </button>
      )}

      {showDelete && (
        <Modal
          as="form"
          onSubmit={onDeleteConfirm}
          onClose={() => setShowDelete(false)}
          labelledBy="delete-account-title"
          className="w-full max-w-md rounded-2xl bg-bg border border-line p-6 mx-4"
        >
          <h2 id="delete-account-title" className="text-lg font-semibold text-primary mb-2">
            {t("deleteTitle")}
          </h2>
          <label className="block text-sm text-muted mb-1.5">
            {t("deleteReasonLabel")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            autoFocus
            placeholder={t("deleteReasonPlaceholder")}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent/60 resize-none"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowDelete(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-40"
            >
              {t("deleteConfirm")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
