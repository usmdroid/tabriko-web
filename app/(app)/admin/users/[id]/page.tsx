"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RefreshCw, X } from "lucide-react";
import {
  fetchUser,
  sendUserNotification,
  blockDevice,
  unblockDevice,
  AdminUserDetail,
  AdminDevice,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";
import { Skeleton } from "@/app/components/Skeleton";

export default function AdminUserDetailPage() {
  const t = useTranslations("adminUsers");
  const params = useParams<{ id: string }>();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccessMsg, setSendSuccessMsg] = useState("");
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    try {
      setDetail(await fetchUser(params.id));
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

  useEffect(() => {
    if (!showNotifyModal) {
      setNotifyTitle("");
      setNotifyBody("");
      setMode("all");
      setSendError("");
      setSelectedIds(new Set());
    }
  }, [showNotifyModal]);

  function toggleDevice(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!detail) return;
    if (detail.devices.length > 0 && selectedIds.size === detail.devices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(detail.devices.map((d) => d.id)));
    }
  }

  async function handleBlockToggle(device: AdminDevice) {
    if (!window.confirm(device.blocked ? t("unblockDeviceConfirm") : t("blockDeviceConfirm"))) return;
    setBlockingId(device.id);
    try {
      if (device.blocked) await unblockDevice(device.id);
      else await blockDevice(device.id);
      await load();
    } catch {
      // silent — load() will restore state
    } finally {
      setBlockingId(null);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    if (!window.confirm(t("confirmSend"))) return;

    setSending(true);
    setSendError("");
    setSendSuccessMsg("");
    try {
      const deviceIds = mode === "all" ? [] : [...selectedIds];
      const result = await sendUserNotification(detail.id, {
        title: notifyTitle,
        body: notifyBody,
        deviceIds,
      });
      // Build a meaningful confirmation from what the backend actually did.
      let msg: string;
      if (!result || result.delivered === 0) {
        msg = t("sendSuccessNoDevice");
      } else if (result.failed > 0) {
        msg = t("sendSuccessPartial", { delivered: result.delivered, failed: result.failed });
      } else {
        msg = t("sendSuccessCount", { delivered: result.delivered });
      }
      setSendSuccessMsg(msg);
      setNotifyTitle("");
      setNotifyBody("");
      setShowNotifyModal(false);
      setTimeout(() => setSendSuccessMsg(""), 5000);
    } catch (e) {
      if (e instanceof ApiError) setSendError(e.message);
      else setSendError(t("error"));
    } finally {
      setSending(false);
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
          {Array.from({ length: 4 }).map((_, i) => (
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

  const allSelected =
    detail.devices.length > 0 && selectedIds.size === detail.devices.length;
  const sendDisabled =
    sending || (mode === "selected" && selectedIds.size === 0);

  return (
    <>
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
      >
        {t("backToList")}
      </Link>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold text-primary">{detail.name}</h1>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            detail.status === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {detail.status === "active" ? t("statusActive") : t("statusBlocked")}
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

      {/* User info card */}
      <div className="surface-card p-5 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colName")}</p>
            <p className="font-medium text-primary">{detail.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colPhone")}</p>
            <p className="font-medium text-primary">{detail.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colRole")}</p>
            <p className="font-medium text-primary">{detail.role}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colStatus")}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                detail.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {detail.status === "active" ? t("statusActive") : t("statusBlocked")}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colCreatedAt")}</p>
            <p className="font-medium text-primary">{detail.createdAt}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colEmail")}</p>
            <p className="font-medium text-primary">{detail.email || <span className="text-muted">{t("notSet")}</span>}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colBirthday")}</p>
            <p className="font-medium text-primary">{detail.birthday || <span className="text-muted">{t("notSet")}</span>}</p>
          </div>
        </div>
      </div>

      {/* Devices card */}
      <div className="surface-card p-5 mb-4">
        <p className="text-sm font-semibold text-primary mb-3">{t("devicesTitle")}</p>
        {detail.devices.length === 0 ? (
          <p className="text-xs text-muted">{t("noDevices")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 pr-3 font-medium">{t("deviceName")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("osVersion")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("appVersion")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("platform")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("lastUpdated")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("integrity")}</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {detail.devices.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="py-2 pr-3 text-primary">{d.deviceName}</td>
                    <td className="py-2 pr-3 text-muted">{d.osVersion}</td>
                    <td className="py-2 pr-3 text-muted">{d.appVersion}</td>
                    <td className="py-2 pr-3 text-muted">{d.platform}</td>
                    <td className="py-2 pr-3 text-muted">{d.updatedAt}</td>
                    <td className="py-2 pr-3">
                      {(d.rooted || d.genuine === false) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          {t("rooted")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          {t("clean")}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        disabled={blockingId === d.id}
                        onClick={() => handleBlockToggle(d)}
                        className="text-xs px-2 py-1 rounded border border-line hover:bg-surface transition-colors"
                      >
                        {blockingId === d.id ? '…' : d.blocked ? t("unblockDevice") : t("blockDevice")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sendSuccessMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 mb-4">
          {sendSuccessMsg}
        </p>
      )}

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowNotifyModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
        >
          {t("notifyTitle")}
        </button>
      </div>
    </div>

    {showNotifyModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setShowNotifyModal(false)}
      >
        <div
          className="surface-card w-full max-w-lg p-6 flex flex-col gap-4 mx-4"
          style={{ animation: "modalIn 200ms ease forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{t("notifyTitle")}</p>
            <button type="button" onClick={() => setShowNotifyModal(false)} className="text-muted hover:text-primary">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("notifyTitleField")}</label>
              <input
                type="text"
                required
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("notifyBody")}</label>
              <textarea
                required
                rows={4}
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="notifyMode"
                  value="all"
                  checked={mode === "all"}
                  onChange={() => setMode("all")}
                  className="accent-accent"
                />
                <span className="text-primary">{t("sendToAll")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="notifyMode"
                  value="selected"
                  checked={mode === "selected"}
                  onChange={() => setMode("selected")}
                  className="accent-accent"
                />
                <span className="text-primary">{t("sendToSelected")}</span>
              </label>
            </div>

            {mode === "selected" && (
              <div className="flex flex-col gap-1">
                {detail.devices.length === 0 ? (
                  <p className="text-xs text-muted">{t("noDevices")}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">
                        {t("chooseDevices")}
                      </label>
                      <button
                        type="button"
                        onClick={toggleAll}
                        className="text-xs text-accent hover:underline"
                      >
                        {allSelected ? t("deselectAll") : t("selectAll")}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-lg border border-line p-1">
                      {detail.devices.map((d) => (
                        <label
                          key={d.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-surface"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(d.id)}
                            onChange={() => toggleDevice(d.id)}
                            className="accent-accent"
                          />
                          <span className="text-sm text-primary">{d.deviceName}</span>
                          <span className="text-xs text-muted">· {d.platform}</span>
                        </label>
                      ))}
                    </div>
                    {selectedIds.size === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t("selectDevicesHint")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {sendError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {sendError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendDisabled}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {sending && <Spinner size={13} />}
                {t("sendBtn")}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
