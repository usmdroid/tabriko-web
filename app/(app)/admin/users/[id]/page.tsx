"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  fetchUser,
  blockDevice,
  unblockDevice,
  AdminUserDetail,
  AdminDevice,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";
import { Skeleton } from "@/app/components/Skeleton";
import { NotifyDialog } from "@/app/components/NotifyDialog";
import { DetailHeader } from "@/app/components/DetailHeader";
import { InfoGrid, InfoField } from "@/app/components/InfoGrid";
import { StatusBadge } from "@/app/components/StatusBadge";

export default function AdminUserDetailPage() {
  const t = useTranslations("adminUsers");
  const params = useParams<{ id: string }>();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockingId, setBlockingId] = useState<string | null>(null);

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

  return (
    <div className="max-w-2xl">
      <DetailHeader
        title={detail.name}
        avatarUrl={detail.avatarUrl}
        badges={
          <StatusBadge
            active={detail.status === "active"}
            activeLabel={t("statusActive")}
            blockedLabel={t("statusBlocked")}
          />
        }
        onReload={load}
        loading={loading}
        backHref="/admin"
        backLabel={t("backToList")}
      />

      <InfoGrid>
        <InfoField label={t("colName")} value={detail.name} />
        <InfoField label={t("colPhone")} value={detail.phone} />
        <InfoField label={t("colRole")} value={detail.role} />
        <InfoField label={t("colStatus")}>
          <StatusBadge
            active={detail.status === "active"}
            activeLabel={t("statusActive")}
            blockedLabel={t("statusBlocked")}
          />
        </InfoField>
        <InfoField label={t("colCreatedAt")} value={detail.createdAt} />
        <InfoField label={t("colEmail")} value={detail.email} />
        <InfoField label={t("colBirthday")} value={detail.birthday} />
      </InfoGrid>

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

      <NotifyDialog userId={detail.id} devices={detail.devices} />
    </div>
  );
}
