"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Plus, X, Phone, AlertTriangle, Lock, CheckCircle, MessageSquare, Send } from "lucide-react";
import {
  fetchCreatorDetail,
  addCreatorContact,
  deleteCreatorContact,
  suspendCreator,
  reactivateCreator,
  deleteCreatorAvatar,
  deleteCreatorBanner,
  postCreatorModeration,
  getCreatorModerationThread,
  getSession,
  AdminCreator,
  AdminCreatorContact,
  ModerationEntry,
  CreatorTier,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatUzPhoneInput, normalizeUzPhone } from "@/lib/phone";
import { Spinner } from "@/app/components/Spinner";
import { Skeleton } from "@/app/components/Skeleton";
import { NotifyDialog } from "@/app/components/NotifyDialog";
import { StatusBadge, WarningBadge } from "@/app/components/StatusBadge";
import { InfoGrid, InfoField } from "@/app/components/InfoGrid";
import { DetailHeader } from "@/app/components/DetailHeader";
import { ProfileBanner } from "@/app/components/ProfileBanner";

const TIER_LABEL: Record<CreatorTier, string> = {
  STANDARD: "Standart",
  RISING: "O'sib kelayotgan",
  TOP: "Top",
  CELEBRITY: "Mashhur",
};

const TIER_COLOR: Record<CreatorTier, string> = {
  STANDARD: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  RISING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TOP: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CELEBRITY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const PHONE_RE = /^\+?[0-9]{9,15}$/;

function formatContactDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("uz-Latn-UZ");
  } catch {
    return iso;
  }
}

function formatThreadDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("uz-Latn-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type ModalKind = "suspend" | "reactivate" | "deleteAvatar" | "deleteBanner" | null;
type WarnTarget = { kind: "name" } | { kind: "requisite"; name: string } | null;

export default function AdminCreatorDetailPage() {
  const t = useTranslations("adminCreators");
  const params = useParams<{ id: string }>();

  const [detail, setDetail] = useState<AdminCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Client-only role check (avoids SSR/hydration mismatch)
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  useEffect(() => {
    const session = getSession();
    setIsSuperadmin(session?.role === "SUPERADMIN");
    setIsModerator(session?.role === "MODERATOR");
  }, []);

  // Suspend / reactivate / delete-image modal
  const [modal, setModal] = useState<ModalKind>(null);
  const [modalReason, setModalReason] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  // Field warning modal
  const [warnTarget, setWarnTarget] = useState<WarnTarget>(null);
  const [warnText, setWarnText] = useState("");
  const [warnBusy, setWarnBusy] = useState(false);
  const [warnError, setWarnError] = useState("");

  // Moderation thread
  const [thread, setThread] = useState<ModerationEntry[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await fetchCreatorDetail(params.id));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  const loadThread = useCallback(async () => {
    if (!params.id) return;
    setThreadLoading(true);
    try {
      setThread(await getCreatorModerationThread(params.id));
    } catch {
      // non-critical
    } finally {
      setThreadLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
    loadThread();
  }, [load, loadThread]);

  function closeAddModal() {
    setShowAdd(false);
    setNewPhone("");
    setNewLabel("");
    setAddError("");
  }

  function closeModal() {
    setModal(null);
    setModalReason("");
    setModalError("");
  }

  function closeWarnModal() {
    setWarnTarget(null);
    setWarnText("");
    setWarnError("");
  }

  async function handleDeleteContact(contact: AdminCreatorContact) {
    if (!detail) return;
    if (!confirm(t("confirmDeleteContact"))) return;
    setBusy(`del-${contact.id}`);
    setActionError("");
    try {
      await deleteCreatorContact(detail.id, contact.id);
      setDetail((prev) =>
        prev ? { ...prev, contacts: prev.contacts.filter((c) => c.id !== contact.id) } : prev,
      );
    } catch (e) {
      if (e instanceof ApiError) setActionError(e.message);
      else setActionError(t("error"));
    } finally {
      setBusy(null);
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    const phone = normalizeUzPhone(newPhone);
    const label = newLabel.trim() || undefined;
    if (!PHONE_RE.test(phone)) {
      setAddError("Telefon raqami noto'g'ri formatda. Misol: +998901234567");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const contact = await addCreatorContact(detail.id, { phone, label });
      setDetail((prev) =>
        prev ? { ...prev, contacts: [...prev.contacts, contact] } : prev,
      );
      closeAddModal();
    } catch (e) {
      if (e instanceof ApiError) setAddError(e.message);
      else setAddError(t("error"));
    } finally {
      setAdding(false);
    }
  }

  async function handleModalConfirm() {
    if (!detail || !modal) return;
    const needsReason = modal !== "reactivate";
    if (needsReason && !modalReason.trim()) return;
    setModalBusy(true);
    setModalError("");
    try {
      if (modal === "suspend") {
        await suspendCreator(detail.id, modalReason.trim());
      } else if (modal === "reactivate") {
        await reactivateCreator(detail.id);
      } else if (modal === "deleteAvatar") {
        await deleteCreatorAvatar(detail.id, modalReason.trim());
      } else if (modal === "deleteBanner") {
        await deleteCreatorBanner(detail.id, modalReason.trim());
      }
      closeModal();
      await load();
      await loadThread();
    } catch (e) {
      if (e instanceof ApiError) setModalError(e.message);
      else setModalError(t("error"));
    } finally {
      setModalBusy(false);
    }
  }

  async function handleWarnConfirm() {
    if (!detail || !warnTarget || !warnText.trim()) return;
    setWarnBusy(true);
    setWarnError("");
    try {
      const prefix =
        warnTarget.kind === "name"
          ? `[${t("warnFieldName")}: ${detail.name}]`
          : `[${t("warnFieldRequisite")}: ${warnTarget.name}]`;
      await postCreatorModeration(detail.id, "WARNING", `${prefix} ${warnText.trim()}`);
      closeWarnModal();
      await loadThread();
    } catch (e) {
      if (e instanceof ApiError) setWarnError(e.message);
      else setWarnError(t("error"));
    } finally {
      setWarnBusy(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !detail) return;
    setSendingChat(true);
    setChatError("");
    try {
      await postCreatorModeration(detail.id, "MESSAGE", chatInput.trim());
      setChatInput("");
      await loadThread();
    } catch (err) {
      if (err instanceof ApiError) setChatError(err.message);
      else setChatError(t("error"));
    } finally {
      setSendingChat(false);
    }
  }

  if (loading && !detail) {
    return (
      <div className="max-w-2xl flex flex-col gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="surface-card p-5 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="surface-card p-5 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && (error || !detail)) {
    return (
      <div className="py-10 text-center text-muted">{error || t("error")}</div>
    );
  }

  if (!detail) return null;

  const isActive = detail.accountStatus === "active";
  const isSuspended = detail.accountStatus === "suspended";
  const canWarn = isSuperadmin || isModerator;

  const tierBadge = detail.tier ? (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[detail.tier]}`}>
      {TIER_LABEL[detail.tier]}
    </span>
  ) : null;

  const statusBadge = (
    <StatusBadge
      active={isActive}
      suspended={isSuspended}
      suspendedLabel={t("statusSuspended")}
    />
  );

  const warningBadge = detail.activeWarningCount && detail.activeWarningCount > 0 ? (
    <WarningBadge count={detail.activeWarningCount} />
  ) : null;

  // Modal config
  const modalNeedsReason = modal !== "reactivate";
  const modalTitle =
    modal === "suspend" ? t("suspendTitle") :
    modal === "reactivate" ? t("reactivateTitle") :
    modal === "deleteAvatar" ? t("deleteAvatarTitle") :
    modal === "deleteBanner" ? t("deleteBannerTitle") : "";

  return (
    <div className="max-w-2xl">
      <DetailHeader
        title={detail.name}
        backHref="/admin/creators"
        backLabel={t("backToList")}
        onReload={load}
        loading={loading}
        reloadLabel={t("reload")}
      />

      {actionError && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      {/* Profile banner: full-width banner + avatar overlaid */}
      <ProfileBanner
        bannerUrl={detail.bannerUrl}
        avatarUrl={detail.avatarUrl}
        name={detail.name}
        subtitle={detail.category}
        badges={
          <>
            {statusBadge}
            {warningBadge}
            {tierBadge}
          </>
        }
        canDeleteImages={isSuperadmin}
        onDeleteAvatar={() => setModal("deleteAvatar")}
        onDeleteBanner={() => setModal("deleteBanner")}
        canWarn={canWarn}
        onWarnName={() => setWarnTarget({ kind: "name" })}
      />

      {/* Info grid */}
      <InfoGrid>
        <InfoField label={t("colPhone")} value={detail.phone} />
        <InfoField label={t("colCategory")} value={detail.category} />
        <InfoField label={t("colTier")}>
          {tierBadge ?? <p className="font-medium text-primary">—</p>}
        </InfoField>
        <InfoField label={t("colStatus")}>
          {statusBadge}
        </InfoField>
      </InfoGrid>

      {/* Status control — SUPERADMIN only, for active or suspended creators */}
      {isSuperadmin && (isActive || isSuspended) && (
        <div className="surface-card p-5 mb-4">
          <p className="text-sm font-semibold text-primary mb-3">{t("holatTitle")}</p>

          {isSuspended && detail.suspensionReason && (
            <div className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
              <p className="text-xs text-muted mb-0.5">{t("suspensionReasonLabel")}</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">{detail.suspensionReason}</p>
            </div>
          )}

          {isActive ? (
            <button
              type="button"
              onClick={() => setModal("suspend")}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-500/10 transition-colors"
            >
              <Lock size={13} />
              {t("suspendBtn")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setModal("reactivate")}
              className="flex items-center gap-1.5 rounded-lg border border-green-500/40 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-500/10 transition-colors"
            >
              <CheckCircle size={13} />
              {t("reactivateBtn")}
            </button>
          )}
        </div>
      )}

      {/* Contact numbers */}
      <div className="surface-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-primary">{t("contactsTitle")}</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors"
          >
            <Plus size={12} />
            {t("addContact")}
          </button>
        </div>

        {detail.contacts.length === 0 ? (
          <p className="text-xs text-muted">{t("noContacts")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {detail.contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Phone size={13} className="text-muted shrink-0" />
                  <span className="font-medium text-primary">{contact.phone}</span>
                  {contact.label && (
                    <span className="text-xs text-muted truncate">({contact.label})</span>
                  )}
                  <span className="text-xs text-muted shrink-0">
                    {formatContactDate(contact.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteContact(contact)}
                  disabled={busy === `del-${contact.id}`}
                  title={t("actionDelete")}
                  aria-label={t("actionDelete")}
                  className="ml-3 flex items-center gap-1 rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {busy === `del-${contact.id}` ? <Spinner size={11} /> : <Trash2 size={11} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rekvizitlar */}
      <div className="rounded-xl border border-line bg-card overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-line">
          <span className="text-sm font-medium text-primary">{t("requisitesTitle")}</span>
        </div>
        {detail.requisites.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted text-center">{t("requisitesEmpty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {detail.requisites.map((r, i) => (
              <li key={i} className="flex items-center gap-2 px-4 py-3 text-sm">
                {r.emoji && <span className="text-base">{r.emoji}</span>}
                <span className="text-primary flex-1">{r.name}</span>
                {canWarn && (
                  <button
                    type="button"
                    onClick={() => setWarnTarget({ kind: "requisite", name: r.name })}
                    title={t("warnBtn")}
                    aria-label={t("warnBtn")}
                    className="inline-flex items-center justify-center w-6 h-6 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors shrink-0"
                  >
                    <AlertTriangle size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Send push notification to this creator */}
      <NotifyDialog userId={detail.id} />

      {/* Moderation chat thread */}
      <div className="surface-card p-5 mb-4">
        <p className="text-sm font-semibold text-primary mb-3">{t("moderationTitle")}</p>

        {threadLoading && thread.length === 0 ? (
          <div className="py-4 flex justify-center">
            <Spinner size={16} />
          </div>
        ) : thread.length === 0 ? (
          <p className="text-xs text-muted mb-4">{t("moderationEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4 max-h-96 overflow-y-auto">
            {thread.map((entry) => {
              const isMessage = entry.kind === "MESSAGE";
              const isWarning = entry.kind === "WARNING";
              const isSuspension = entry.kind === "SUSPENSION";
              const isReactivation = entry.kind === "REACTIVATION";

              let bubbleClass = "bg-card text-primary";
              let kindLabel: React.ReactNode = null;

              if (isMessage) {
                bubbleClass = "bg-card text-primary";
                kindLabel = (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted">
                    <MessageSquare size={11} />
                    {t("kindMESSAGE")}
                  </span>
                );
              } else if (isWarning) {
                bubbleClass = "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-primary";
                kindLabel = (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={11} />
                    {t("kindWARNING")}
                  </span>
                );
              } else if (isSuspension) {
                bubbleClass = "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-primary";
                kindLabel = (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
                    <Lock size={11} />
                    {t("kindSUSPENSION")}
                  </span>
                );
              } else if (isReactivation) {
                bubbleClass = "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-primary";
                kindLabel = (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <CheckCircle size={11} />
                    {t("kindREACTIVATION")}
                  </span>
                );
              }

              return (
                <div key={entry.id} className={`rounded-xl px-4 py-3 text-sm ${bubbleClass}`}>
                  <div className="flex items-center justify-between mb-1 gap-2">
                    {kindLabel}
                    <span className="text-xs text-muted shrink-0">{formatThreadDate(entry.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted mb-0.5">{entry.author}</p>
                  <p>{entry.body}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat composer */}
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sendingChat || !chatInput.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
          >
            {sendingChat ? <Spinner size={13} /> : <Send size={13} />}
            {t("sendBtn")}
          </button>
        </form>

        {chatError && (
          <p className="mt-2 text-xs text-red-500">{chatError}</p>
        )}
      </div>

      {/* Add contact modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeAddModal}
        >
          <form
            onSubmit={handleAddContact}
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">{t("addContact")}</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-muted hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {addError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("phoneLabel")}</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(formatUzPhoneInput(e.target.value))}
                placeholder="+998 90 123 45 67"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("labelLabel")}</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={100}
                placeholder={t("labelLabel")}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {adding && <Spinner size={13} />}
                {t("addContact")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suspend / reactivate / delete-image modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">{modalTitle}</h2>
              <button type="button" onClick={closeModal} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {modalError}
              </p>
            )}

            {modalNeedsReason && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">{t("modalReasonLabel")}</label>
                <textarea
                  required
                  rows={3}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
            )}

            {!modalNeedsReason && (
              <p className="text-sm text-muted">{t("reactivateConfirm")}</p>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                disabled={modalBusy || (modalNeedsReason && !modalReason.trim())}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {modalBusy && <Spinner size={13} />}
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field warning modal */}
      {warnTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeWarnModal}
        >
          <div
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">{t("warnTitle")}</h2>
              <button type="button" onClick={closeWarnModal} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted">
              {warnTarget.kind === "name"
                ? `${t("warnFieldName")}: ${detail.name}`
                : `${t("warnFieldRequisite")}: ${warnTarget.name}`}
            </p>

            {warnError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {warnError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("warnMessageLabel")}</label>
              <textarea
                required
                rows={3}
                value={warnText}
                onChange={(e) => setWarnText(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={closeWarnModal}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleWarnConfirm}
                disabled={warnBusy || !warnText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {warnBusy && <Spinner size={13} />}
                <AlertTriangle size={13} />
                {t("warnBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
