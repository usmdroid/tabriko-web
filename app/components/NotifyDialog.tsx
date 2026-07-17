"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  sendUserNotification,
  fetchUser,
  AdminDevice,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";

// Reusable "send push notification to a user" flow (trigger button + modal).
// Used by the user detail page and the creator detail page — a creator's id IS
// their user id, so the same /admin/users/{id}/notify endpoint applies.
// Pass `devices` when the caller already has them (user page); otherwise the
// dialog fetches them itself via fetchUser (creator page).
export function NotifyDialog({
  userId,
  devices: devicesProp,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  userId: string;
  devices?: AdminDevice[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("adminUsers");

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };
  const [devices, setDevices] = useState<AdminDevice[]>(devicesProp ?? []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (devicesProp) setDevices(devicesProp);
  }, [devicesProp]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setMode("all");
      setError("");
      setSelectedIds(new Set());
      return;
    }
    // Caller didn't supply devices (creator page) — load them for selection.
    if (!devicesProp) {
      fetchUser(userId)
        .then((u) => setDevices(u.devices))
        .catch(() => setDevices([]));
    }
  }, [open, devicesProp, userId]);

  function toggleDevice(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (devices.length > 0 && selectedIds.size === devices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(devices.map((d) => d.id)));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(t("confirmSend"))) return;

    setSending(true);
    setError("");
    setSuccessMsg("");
    try {
      const deviceIds = mode === "all" ? [] : [...selectedIds];
      const result = await sendUserNotification(userId, {
        title,
        body,
        deviceIds,
      });
      let msg: string;
      if (!result || result.delivered === 0) {
        msg = t("sendSuccessNoDevice");
      } else if (result.failed > 0) {
        msg = t("sendSuccessPartial", {
          delivered: result.delivered,
          failed: result.failed,
        });
      } else {
        msg = t("sendSuccessCount", { delivered: result.delivered });
      }
      setSuccessMsg(msg);
      setOpen(false);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t("error"));
    } finally {
      setSending(false);
    }
  }

  const allSelected =
    devices.length > 0 && selectedIds.size === devices.length;
  const sendDisabled =
    sending || (mode === "selected" && selectedIds.size === 0);

  return (
    <>
      {successMsg && (
        <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 mb-4">
          {successMsg}
        </p>
      )}

      {!hideTrigger && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
          >
            {t("notifyTitle")}
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface-card w-full max-w-lg p-6 flex flex-col gap-4 mx-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">
                {t("notifyTitle")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">
                  {t("notifyTitleField")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">
                  {t("notifyBody")}
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
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
                  {devices.length === 0 ? (
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
                        {devices.map((d) => (
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
                            <span className="text-sm text-primary">
                              {d.deviceName}
                            </span>
                            <span className="text-xs text-muted">
                              · {d.platform}
                            </span>
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

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
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
