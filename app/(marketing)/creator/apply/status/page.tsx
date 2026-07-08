"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RefreshCw, Send, ExternalLink } from "lucide-react";
import { Spinner } from "@/app/components/Spinner";
import {
  getApplicationStatus,
  replyToApplication,
  ApplicationDetail,
  ApplicationStatus,
  ApiError,
} from "@/lib/api";

const STORAGE_KEY = "creator_application";
const CREATOR_LOGIN_PATH = "/creator/login";

type StatusColor = "blue" | "amber" | "green" | "red";

function statusColor(status: ApplicationStatus): StatusColor {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  if (status === "INFO_REQUESTED") return "amber";
  return "blue";
}

const COLOR_CLASSES: Record<StatusColor, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function CreatorApplyStatusPage() {
  const t = useTranslations("creatorApply");

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id");
    const tokenFromUrl = params.get("token");

    if (idFromUrl && tokenFromUrl) {
      setApplicationId(idFromUrl);
      setTrackingToken(tokenFromUrl);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { applicationId: id, trackingToken: tok } = JSON.parse(raw);
        setApplicationId(id ?? null);
        setTrackingToken(tok ?? null);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const load = useCallback(async () => {
    if (!applicationId || !trackingToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await getApplicationStatus(applicationId, trackingToken);
      setDetail(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [applicationId, trackingToken, t]);

  useEffect(() => {
    if (applicationId && trackingToken) {
      load();
    } else if (applicationId === null && trackingToken === null) {
      setLoading(false);
    }
  }, [applicationId, trackingToken, load]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId || !trackingToken || !replyText.trim()) return;
    setReplying(true);
    setReplyError("");
    try {
      await replyToApplication(applicationId, trackingToken, replyText.trim());
      setReplyText("");
      await load();
    } catch (err) {
      if (err instanceof ApiError) setReplyError(err.message);
      else setReplyError(t("loadError"));
    } finally {
      setReplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={24} className="text-accent" />
      </div>
    );
  }

  if (!applicationId || !trackingToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <p className="text-muted mb-4">{t("trackingMissing")}</p>
          <Link
            href="/creator/apply"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
          >
            {t("applyNew")}
          </Link>
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
          >
            <RefreshCw size={14} />
            {t("refreshBtn")}
          </button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const color = statusColor(detail.status);
  const statusKey = `status${detail.status}` as const;

  return (
    <div className="min-h-[60vh] px-4 py-16">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary">{t("statusPageTitle")}</h1>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:bg-card transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} />
            {t("refreshBtn")}
          </button>
        </div>

        {/* Status badge */}
        <div className="surface-card p-5 mb-4">
          <p className="text-xs font-medium text-muted mb-2">{t("statusLabel")}</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${COLOR_CLASSES[color]}`}>
            {t(statusKey)}
          </span>

          {/* APPROVED */}
          {detail.status === "APPROVED" && (
            <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 p-4">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-1">{t("approvedTitle")}</p>
              <p className="text-sm text-green-700/80 dark:text-green-400/80 mb-3">{t("approvedText")}</p>
              <Link
                href={CREATOR_LOGIN_PATH}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                {t("setPasswordBtn")}
                <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {/* REJECTED */}
          {detail.status === "REJECTED" && (
            <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">{t("rejectedTitle")}</p>
              {detail.decisionReason && (
                <p className="text-sm text-red-700/80 dark:text-red-400/80">
                  <span className="font-medium">{t("rejectedReasonLabel")}:</span>{" "}
                  {detail.decisionReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Telegram verification */}
        {detail.socialTypes?.includes("TELEGRAM") && detail.status !== "APPROVED" && detail.status !== "REJECTED" && (
          <div className="surface-card p-5 mb-4">
            <p className="text-sm font-semibold text-primary mb-2">{t("telegramVerifyTitle")}</p>
            <p className="text-xs text-muted mb-3">{t("telegramVerifyDesc")}</p>
            {detail.telegramUsername && (
              <p className="text-xs text-muted mb-3">
                {t("tgUsernameLabel")}: <span className="text-primary">@{detail.telegramUsername}</span>
              </p>
            )}
            {detail.id && (
              <a
                href={`https://t.me/tabrikoverifybot?start=${detail.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2AABEE] px-4 py-2 text-sm font-medium text-white hover:bg-[#229ED9] transition-colors"
              >
                {t("telegramOpenBot")}
                <ExternalLink size={13} />
              </a>
            )}
            {detail.verification?.telegram && (
              <div className="mt-3 text-xs text-muted">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  detail.verification.telegram.verified
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {detail.verification.telegram.verified
                    ? t("telegramVerifiedBadge")
                    : t("telegramNotVerifiedBadge")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instagram verification */}
        {detail.socialTypes?.includes("INSTAGRAM") && detail.status !== "APPROVED" && detail.status !== "REJECTED" && (detail.igVerifyCode || detail.igInstructions) && (
          <div className="surface-card p-5 mb-4">
            <p className="text-sm font-semibold text-primary mb-2">{t("igVerifyTitle")}</p>
            {detail.igVerifyCode && (
              <div className="mb-2">
                <p className="text-xs text-muted mb-1">{t("igVerifyCodeLabel")}</p>
                <code className="block rounded-lg bg-card px-3 py-2 text-sm font-mono text-primary select-all">
                  {detail.igVerifyCode}
                </code>
              </div>
            )}
            <p className="text-xs text-muted">{t("igVerifyInstruction")}</p>
          </div>
        )}

        {/* INFO_REQUESTED reply */}
        {detail.status === "INFO_REQUESTED" && (
          <div className="surface-card p-5 mb-4">
            <p className="text-sm font-semibold text-primary mb-1">{t("infoRequestedTitle")}</p>
            <p className="text-xs text-muted mb-4">{t("infoRequestedDesc")}</p>

            <form onSubmit={handleReply} className="flex flex-col gap-3">
              <textarea
                required
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("replyPlaceholder")}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
              {replyError && (
                <p className="text-xs text-red-500">{replyError}</p>
              )}
              <button
                type="submit"
                disabled={replying || !replyText.trim()}
                className="flex items-center justify-center gap-2 self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {replying ? <Spinner size={13} /> : <Send size={13} />}
                {replying ? t("replySending") : t("replyBtn")}
              </button>
            </form>
          </div>
        )}

        {/* Message thread */}
        {(detail.messages?.length ?? 0) > 0 && (
          <div className="surface-card p-5">
            <p className="text-sm font-semibold text-primary mb-3">{t("messagesTitle")}</p>
            <div className="flex flex-col gap-3">
              {detail.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    msg.author === "MODERATOR"
                      ? "bg-card text-primary self-start max-w-[80%]"
                      : "bg-accent/10 text-accent self-end max-w-[80%] ml-auto"
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {msg.author === "MODERATOR" ? t("adminLabel") : t("youLabel")}
                  </p>
                  <p>{msg.text}</p>
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs underline opacity-70 hover:opacity-100"
                    >
                      <ExternalLink size={11} />
                      {t("fileLabel")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(detail.messages?.length ?? 0) === 0 && detail.status !== "INFO_REQUESTED" && (
          <p className="text-center text-sm text-muted py-4">{t("noMessages")}</p>
        )}
      </div>
    </div>
  );
}
