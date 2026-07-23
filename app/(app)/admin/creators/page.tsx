"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, CheckCircle, X, User } from "lucide-react";
import {
  fetchCreators,
  addCreator,
  verifyCreator,
  uploadCreatorAvatar,
  uploadCreatorBanner,
  AdminCreator,
  CreatorTier,
} from "@/lib/admin-api";
import { ApiError, getCategories, Category } from "@/lib/api";
import { formatUzPhoneInput, normalizeUzPhone } from "@/lib/phone";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const TIER_COLOR: Record<CreatorTier, string> = {
  STANDARD: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  RISING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  TOP: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CELEBRITY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function AdminCreatorsPage() {
  const router = useRouter();
  const t = useTranslations("adminCreators");

  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [newTier, setNewTier] = useState<CreatorTier>("STANDARD");
  const [newPassportSeries, setNewPassportSeries] = useState("");
  const [newPassportNumber, setNewPassportNumber] = useState("");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCreators(await fetchCreators());
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

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  async function handleVerify(creator: AdminCreator) {
    setBusy((b) => ({ ...b, [creator.id]: true }));
    try {
      await verifyCreator(creator.id);
      setCreators((prev) =>
        prev.map((c) => (c.id === creator.id ? { ...c, verified: true } : c)),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [creator.id]: false }));
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAddError(t("errAvatarType")); return; }
    if (file.size > 5 * 1024 * 1024) { setAddError(t("errAvatarSize")); return; }
    setNewAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAddError(t("errBannerType")); return; }
    if (file.size > 5 * 1024 * 1024) { setAddError(t("errBannerSize")); return; }
    setNewBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryId) {
      setAddError(t("errCategoryRequired"));
      return;
    }
    const series = newPassportSeries.trim();
    const number = newPassportNumber.trim();
    if (series || number) {
      if (!/^[A-Z]{2}$/.test(series)) {
        setAddError(t("errPassportSeries"));
        return;
      }
      if (!/^[0-9]{7}$/.test(number)) {
        setAddError(t("errPassportNumber"));
        return;
      }
    }
    setAdding(true);
    setAddError("");
    try {
      const created = await addCreator({
        name: newName,
        phone: normalizeUzPhone(newPhone),
        categoryId: newCategoryId,
        tier: newTier,
        ...(series && number ? { passportSeries: series, passportNumber: number } : {}),
      });
      if (newAvatar && created?.id) {
        try {
          await uploadCreatorAvatar(created.id, newAvatar);
        } catch (err) {
          setAddError(err instanceof ApiError ? err.message : t("errAvatarUpload"));
          await load(); // creator exists in list without avatar; keep modal open
          return;
        }
      }
      if (newBanner && created?.id) {
        try {
          await uploadCreatorBanner(created.id, newBanner);
        } catch (err) {
          setAddError(err instanceof ApiError ? err.message : t("errBannerUpload"));
          await load();
          return;
        }
      }
      setShowAdd(false);
      setNewName("");
      setNewPhone("");
      setNewCategoryId("");
      setNewTier("STANDARD");
      setNewPassportSeries("");
      setNewPassportNumber("");
      setNewAvatar(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setNewBanner(null);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setAddError(err.message);
      else setAddError(t("error"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-primary">{t("pageTitle")}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 btn-neon rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={15} />
          {t("addBtn")}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">{t("colName")}</th>
                <th className="px-4 py-3 font-medium">{t("colCategory")}</th>
                <th className="px-4 py-3 font-medium">{t("colTier")}</th>
                <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("colFlag")}</th>
                <th className="px-4 py-3 font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    {t("notFound")}
                  </td>
                </tr>
              ) : (
                creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/creators/${creator.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-primary">
                      <div className="flex items-center gap-2">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : creator.name && creator.name.trim() ? (
                          <span className="w-7 h-7 rounded-full bg-card border border-line shrink-0 flex items-center justify-center text-xs font-semibold text-muted select-none">
                            {creator.name.trim().charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-card border border-line shrink-0 flex items-center justify-center text-muted">
                            <User size={14} />
                          </span>
                        )}
                        <Link
                          href={`/admin/creators/${creator.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-accent transition-colors"
                        >
                          {creator.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{creator.category}</td>
                    <td className="px-4 py-3">
                      {creator.tier ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[creator.tier]}`}>
                          {t(`tier${creator.tier}`)}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          creator.verified
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {creator.verified ? t("statusVerified") : t("statusUnverified")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {creator.flag ? (
                        <span className="inline-flex rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">
                          {creator.flag === "top" ? t("flagTop") : t("flagExclusive")}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!creator.verified && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerify(creator); }}
                            disabled={busy[creator.id]}
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                          >
                            {busy[creator.id] ? <Spinner size={11} /> : <CheckCircle size={11} />}
                            {t("actionVerify")}
                          </button>
                        )}
                        <Link
                          href={`/admin/creators/${creator.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors"
                        >
                          {t("actionDetail")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add creator modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAdd(false)}
        >
          <form
            onSubmit={handleAdd}
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">{t("addTitle")}</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            {addError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {addError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("fieldName")}</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("fieldPhone")}</label>
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
              <label className="text-xs font-medium text-muted">
                {t("fieldAvatar")} <span className="text-muted">(optional)</span>
              </label>
              {avatarPreview ? (
                <div className="flex items-center gap-2">
                  <img src={avatarPreview} alt="" className="w-16 h-16 rounded-lg object-cover border border-line shrink-0" />
                  <div className="flex flex-col gap-1">
                    <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors text-center">
                      {t("avatarChange")}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setNewAvatar(null); if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      {t("avatarRemove")}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center rounded-lg border border-dashed border-line px-3 py-4 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors">
                  {t("avatarPickPrompt")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>

            {/* Banner picker */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">
                {t("fieldBanner")} <span className="text-muted">(optional)</span>
              </label>
              {bannerPreview ? (
                <div className="flex flex-col gap-1.5">
                  <img src={bannerPreview} alt="" className="aspect-video w-full object-cover rounded-lg border border-line" />
                  <div className="flex gap-2">
                    <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors text-center">
                      {t("bannerChange")}
                      <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setNewBanner(null); if (bannerPreview) URL.revokeObjectURL(bannerPreview); setBannerPreview(null); }}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      {t("bannerRemove")}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center rounded-lg border border-dashed border-line aspect-video w-full text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors">
                  {t("bannerPickPrompt")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("fieldCategory")}</label>
              <select
                required
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="">{t("fieldCategoryPlaceholder")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-muted">{t("fieldPassportSeries")}</label>
                <input
                  type="text"
                  maxLength={2}
                  value={newPassportSeries}
                  onChange={(e) => setNewPassportSeries(e.target.value.toUpperCase())}
                  placeholder={t("fieldPassportSeriesPlaceholder")}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-muted">{t("fieldPassportNumber")}</label>
                <input
                  type="text"
                  maxLength={7}
                  value={newPassportNumber}
                  onChange={(e) => setNewPassportNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("fieldPassportNumberPlaceholder")}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("fieldTier")}</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as CreatorTier)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="STANDARD">{t("tierSTANDARD")}</option>
                <option value="RISING">{t("tierRISING")}</option>
                <option value="TOP">{t("tierTOP")}</option>
                <option value="CELEBRITY">{t("tierCELEBRITY")}</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                {t("cancelBtn")}
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {adding && <Spinner size={13} />}
                {t("saveBtn")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
