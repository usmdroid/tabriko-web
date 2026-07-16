"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X, ExternalLink, Trash2, RefreshCw, Send } from "lucide-react";
import {
  fetchApplication,
  reviewApplication,
  rejectApplication,
  confirmInstagram,
  messageApplication,
  approveApplication,
  deleteApplication,
  AdminApplicationDetail,
  AdminApplicationStatus,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";
import { Skeleton } from "@/app/components/Skeleton";

const STATUS_COLORS: Record<AdminApplicationStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  UNDER_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  INFO_REQUESTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type ModalType = "reject" | null;

interface ActionModalProps {
  type: ModalType;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

function ActionModal({ type, onClose, onSubmit }: ActionModalProps) {
  const t = useTranslations("adminApplications");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!type) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await onSubmit(text.trim());
      onClose();
    } catch (e) {
      if (e instanceof ApiError) setErr(e.message);
      else setErr(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
        style={{ animation: "modalIn 200ms ease forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">{t("modalRejectTitle")}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-primary">
            <X size={18} />
          </button>
        </div>

        {err && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {err}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">{t("modalRejectLabel")}</label>
          <textarea
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
          >
            {t("modalCancel")}
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
          >
            {busy && <Spinner size={13} />}
            {t("modalSend")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const t = useTranslations("adminApplications");
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await fetchApplication(params.id));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setActionError("");
    try {
      await fn();
      await load();
    } catch (e) {
      if (e instanceof ApiError) setActionError(e.message);
      else setActionError(t("error"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    if (!confirm(t("confirmDelete"))) return;
    setBusy("delete");
    setActionError("");
    try {
      await deleteApplication(detail.id);
      router.push("/admin/applications");
    } catch (e) {
      if (e instanceof ApiError) setActionError(e.message);
      else setActionError(t("error"));
      setBusy(null);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !detail) return;
    setSendingChat(true);
    setChatError("");
    try {
      await messageApplication(detail.id, chatInput.trim());
      setChatInput("");
      await load();
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
        <Skeleton className="h-7 w-56" />
        <div className="surface-card p-5 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="py-10 text-center text-muted">
        {error || t("error")}
      </div>
    );
  }

  if (!detail) return null;

  const status = detail.status;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/applications" className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block">
        {t("backToList")}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-primary">{t("detailTitle")}</h1>
        <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
          {t(`status${status}`)}
        </span>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          title={t("reload")}
          aria-label={t("reload")}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-40"
        >
          {loading ? <Spinner size={15} /> : <RefreshCw size={15} />}
        </button>
      </div>

      {actionError && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}

      {/* Applicant info */}
      <div className="surface-card p-5 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colName")}</p>
            <p className="font-medium text-primary">{detail.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colPhone")}</p>
            <p className="font-medium text-primary">{detail.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colActivity")}</p>
            <p className="font-medium text-primary">
              {detail.categoryName ?? detail.otherText ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colSocial")}</p>
            <p className="font-medium text-primary">
              {detail.socialTypes?.length ? detail.socialTypes.join(", ") : "—"}
              {detail.igUsername && ` · @${detail.igUsername}`}
              {detail.telegramUsername && ` · @${detail.telegramUsername}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("passport")}</p>
            <p className="font-medium text-primary">
              {detail.passportSeries || detail.passportNumber
                ? `${detail.passportSeries ?? ""} ${detail.passportNumber ?? ""}`.trim()
                : "—"}
            </p>
          </div>
        </div>

        {detail.decisionReason && (
          <div className="mt-3 pt-3 border-t border-line">
            <p className="text-xs text-muted mb-0.5">{t("modalRejectLabel")}</p>
            <p className="text-sm text-red-600 dark:text-red-400">{detail.decisionReason}</p>
          </div>
        )}
      </div>

      {/* Sample video */}
      {detail.sampleVideoUrl && (
        <div className="surface-card p-4 mb-4">
          <p className="text-xs font-medium text-muted mb-2">{t("sampleVideoTitle")}</p>
          <a
            href={detail.sampleVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <ExternalLink size={14} />
            {detail.sampleVideoUrl}
          </a>
        </div>
      )}

      {/* Verification */}
      <div className="surface-card p-5 mb-4">
        <p className="text-sm font-semibold text-primary mb-3">{t("verificationTitle")}</p>

        {detail.socialTypes?.includes("TELEGRAM") && (
          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("telegramTitle")}</p>
            {(() => {
              const tg = detail.verification?.telegram;
              const hasBotData = tg && (tg.channelName != null || tg.subscribers != null);
              return (
                <div className="text-sm space-y-1">
                  {tg?.channelName != null && (
                    <p className="text-primary">
                      <span className="text-muted text-xs">{t("channel")}: </span>
                      {tg.channelName}
                    </p>
                  )}
                  {tg?.channelUsername != null && (
                    <p className="text-primary">
                      <span className="text-muted text-xs">{t("channelUsername")}: </span>
                      @{tg.channelUsername}
                    </p>
                  )}
                  {tg?.subscribers != null && (
                    <p className="text-primary">
                      <span className="text-muted text-xs">{t("subscribers")}: </span>
                      {tg.subscribers}
                    </p>
                  )}
                  {tg?.ownerStatus != null && (
                    <p className="text-primary">
                      <span className="text-muted text-xs">{t("ownerStatus")}: </span>
                      {tg.ownerStatus}
                    </p>
                  )}
                  {tg?.chatType != null && (
                    <p className="text-primary">
                      <span className="text-muted text-xs">{t("chatType")}: </span>
                      {tg.chatType}
                    </p>
                  )}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    tg?.verified
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {tg?.verified ? t("verified") : t("notVerified")}
                  </span>
                  {!hasBotData && (
                    <p className="text-xs text-muted pt-1">{t("botDataPending")}</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {detail.socialTypes?.includes("INSTAGRAM") && (
          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("igTitle")}</p>
            <div className="text-sm space-y-2">
              {detail.igVerifyCode && (
                <div>
                  <p className="text-xs text-muted mb-1">{t("expectedTextLabel")}</p>
                  <code className="block rounded bg-card px-2 py-1 text-xs font-mono text-primary">
                    {`${detail.name ?? ""} (${detail.categoryName ?? detail.otherText ?? ""}) - ${detail.igVerifyCode}`}
                  </code>
                </div>
              )}
              {detail.igUsername && (
                <div>
                  <p className="text-xs text-muted mb-1">{t("usernameToConfirmLabel")}</p>
                  <p className="font-medium text-primary">@{detail.igUsername}</p>
                  <p className="text-xs text-muted mt-0.5">{t("usernameConfirmHint")}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  detail.verification?.instagram?.ownershipConfirmed
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {detail.verification?.instagram?.ownershipConfirmed ? t("verified") : t("notVerified")}
                </span>
                {!detail.verification?.instagram?.ownershipConfirmed && (
                  <button
                    onClick={() =>
                      runAction("confirmIg", () => confirmInstagram(detail.id))
                    }
                    disabled={busy === "confirmIg"}
                    className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                  >
                    {busy === "confirmIg" ? <Spinner size={11} /> : null}
                    {t("actionConfirmIg")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {status !== "APPROVED" && status !== "REJECTED" && (
        <div className="surface-card p-5 mb-4">
          <p className="text-sm font-semibold text-primary mb-3">{t("sectionHolat")}</p>
          <div className="flex flex-wrap gap-2">
            {status === "SUBMITTED" && (
              <button
                onClick={() =>
                  runAction("review", () => reviewApplication(detail.id))
                }
                disabled={busy === "review"}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {busy === "review" && <Spinner size={11} />}
                {t("actionUnderReview")}
              </button>
            )}

            <button
              onClick={() => setModal("reject")}
              className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:border-red-500 hover:text-red-600 transition-colors"
            >
              {t("actionReject")}
            </button>

            {(status === "UNDER_REVIEW" || status === "INFO_REQUESTED") && (
              <button
                onClick={() =>
                  runAction("approve", () => approveApplication(detail.id))
                }
                disabled={busy === "approve"}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {busy === "approve" && <Spinner size={11} />}
                {t("actionApprove")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="surface-card p-5 mb-4">
        <button
          onClick={handleDelete}
          disabled={busy === "delete"}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {busy === "delete" ? <Spinner size={11} /> : <Trash2 size={13} />}
          {t("actionDelete")}
        </button>
      </div>

      {/* Message thread */}
      <div className="surface-card p-5">
        <p className="text-sm font-semibold text-primary mb-3">{t("threadTitle")}</p>
        {(detail.messages?.length ?? 0) === 0 ? (
          <p className="text-xs text-muted mb-4">{t("noMessages")}</p>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {detail.messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-4 py-3 text-sm max-w-[85%] ${
                  msg.author === "MODERATOR"
                    ? "bg-accent/10 text-primary self-end ml-auto"
                    : "bg-card text-primary self-start"
                }`}
              >
                <p className="text-xs font-medium mb-1 text-muted">
                  {msg.author === "MODERATOR" ? t("adminLabel") : t("applicantLabel")}
                </p>
                <p>{msg.text}</p>
                {msg.fileUrl && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline"
                  >
                    <ExternalLink size={11} />
                    {t("fileLabel")}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {chatError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-2">
            {chatError}
          </p>
        )}
        <form
          onSubmit={handleSendChat}
          className="flex gap-2 items-end border-t border-line pt-3"
        >
          <textarea
            rows={2}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            disabled={sendingChat}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sendingChat || !chatInput.trim()}
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-accent text-white hover:bg-hover transition-colors disabled:opacity-60 flex-shrink-0"
          >
            {sendingChat ? <Spinner size={15} /> : <Send size={15} />}
          </button>
        </form>
      </div>

      {/* Action modals */}
      <ActionModal
        type={modal}
        onClose={() => setModal(null)}
        onSubmit={async (text) => {
          await rejectApplication(detail.id, text);
          await load();
        }}
      />
    </div>
  );
}
