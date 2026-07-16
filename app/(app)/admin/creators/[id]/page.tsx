"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Trash2, RefreshCw, Plus, X, Phone } from "lucide-react";
import {
  fetchCreatorDetail,
  addCreatorContact,
  deleteCreatorContact,
  uploadCreatorAvatar,
  uploadCreatorBanner,
  AdminCreator,
  AdminCreatorContact,
  CreatorTier,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatUzPhoneInput, normalizeUzPhone } from "@/lib/phone";
import { Spinner } from "@/app/components/Spinner";
import { Skeleton } from "@/app/components/Skeleton";
import { NotifyDialog } from "@/app/components/NotifyDialog";

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

  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [savingImages, setSavingImages] = useState(false);
  const [imageError, setImageError] = useState("");

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

  useEffect(() => {
    load();
  }, [load]);

  function closeAddModal() {
    setShowAdd(false);
    setNewPhone("");
    setNewLabel("");
    setAddError("");
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

  function handleEditAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImageError(t("errAvatarType")); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError(t("errAvatarSize")); return; }
    setEditAvatar(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  }

  function handleEditBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImageError(t("errBannerType")); return; }
    if (file.size > 5 * 1024 * 1024) { setImageError(t("errBannerSize")); return; }
    setEditBanner(file);
    setEditBannerPreview(URL.createObjectURL(file));
  }

  async function handleSaveImages() {
    if (!detail || (!editAvatar && !editBanner)) return;
    setSavingImages(true);
    setImageError("");
    try {
      if (editAvatar) {
        const updated = await uploadCreatorAvatar(detail.id, editAvatar);
        setDetail(updated);
        setEditAvatar(null);
        if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
        setEditAvatarPreview(null);
      }
      if (editBanner) {
        const updated = await uploadCreatorBanner(detail.id, editBanner);
        setDetail(updated);
        setEditBanner(null);
        if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
        setEditBannerPreview(null);
      }
    } catch (e) {
      if (e instanceof ApiError) setImageError(e.message);
      else setImageError(t("errAvatarUpload"));
    } finally {
      setSavingImages(false);
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
      <div className="py-10 text-center text-muted">{error || t("error")}</div>
    );
  }

  if (!detail) return null;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/creators"
        className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
      >
        {t("backToList")}
      </Link>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-xl font-semibold text-primary">{detail.name}</h1>
        <span className="text-sm text-muted">{detail.category}</span>
        {detail.tier && (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[detail.tier]}`}
          >
            {TIER_LABEL[detail.tier]}
          </span>
        )}
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            detail.accountStatus === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {detail.accountStatus === "active" ? "Faol" : "Bloklangan"}
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

      {/* Creator main info */}
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
            <p className="text-xs text-muted mb-0.5">{t("colCategory")}</p>
            <p className="font-medium text-primary">{detail.category}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colTier")}</p>
            {detail.tier ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[detail.tier]}`}
              >
                {TIER_LABEL[detail.tier]}
              </span>
            ) : (
              <span className="font-medium text-primary">—</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">{t("colStatus")}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                detail.accountStatus === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {detail.accountStatus === "active" ? "Faol" : "Bloklangan"}
            </span>
          </div>
        </div>
      </div>

      {/* Images card */}
      <div className="surface-card p-5 mb-4">
        <p className="text-sm font-semibold text-primary mb-3">{t("imagesTitle")}</p>

        {imageError && (
          <p className="mb-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {imageError}
          </p>
        )}

        {/* Avatar row */}
        <div className="flex items-center gap-3 mb-4">
          {editAvatarPreview ? (
            <img src={editAvatarPreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-line shrink-0" />
          ) : detail.avatarUrl ? (
            <img src={detail.avatarUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-line shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-card border border-line shrink-0" />
          )}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted">{t("fieldAvatar")}</p>
            <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors text-center">
              {t("avatarChange")}
              <input type="file" accept="image/*" className="hidden" onChange={handleEditAvatarChange} />
            </label>
          </div>
        </div>

        {/* Banner row */}
        <div className="flex flex-col gap-1.5 mb-4">
          <p className="text-xs text-muted">{t("fieldBanner")}</p>
          {editBannerPreview ? (
            <img src={editBannerPreview} alt="" className="aspect-video w-full object-cover rounded-lg border border-line" />
          ) : detail.bannerUrl ? (
            <img src={detail.bannerUrl} alt="" className="aspect-video w-full object-cover rounded-lg border border-line" />
          ) : (
            <div className="aspect-video w-full rounded-lg border border-dashed border-line flex items-center justify-center text-xs text-muted">
              {t("bannerPickPrompt")}
            </div>
          )}
          <label className="cursor-pointer self-start rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent/50 hover:text-accent transition-colors">
            {t("bannerChange")}
            <input type="file" accept="image/*" className="hidden" onChange={handleEditBannerChange} />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSaveImages}
          disabled={savingImages || (!editAvatar && !editBanner)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
        >
          {savingImages && <Spinner size={13} />}
          {t("imagesSave")}
        </button>
      </div>

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
                <span className="text-primary">{r.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Send push notification to this creator (same flow as users) */}
      <NotifyDialog userId={detail.id} />

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
    </div>
  );
}
