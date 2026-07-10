"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  getCreatorProfile,
  updateCreatorProfile,
  getPortfolio,
  addPortfolioItem,
  deletePortfolioItem,
  CreatorProfile,
  PortfolioItem,
} from "@/lib/creator-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const MISSING_LABEL: Record<string, string> = {
  bio: "Bio",
  priceFrom: "Narx",
  deliveryDays: "Yetkazish muddati",
  portfolio: "Portfolio",
  passport: "Pasport",
  payment: "To'lov rekvizitlari",
  social: "Ijtimoiy havolalar",
  passportNumber: "Pasport raqami",
  paymentCardNumber: "To'lov karta raqami",
  paymentHolderName: "Karta egasi ismi",
  telegram: "Telegram",
  instagram: "Instagram",
};

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile form
  const [bio, setBio] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Portfolio add
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, items] = await Promise.all([
        getCreatorProfile(),
        getPortfolio(),
      ]);
      setProfile(p);
      setBio(p.bio ?? "");
      setPriceFrom(p.priceFrom ? String(p.priceFrom) : "");
      setDeliveryDays(p.deliveryDays ? String(p.deliveryDays) : "");
      setPortfolio(items);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Ma'lumot yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateCreatorProfile({
        bio: bio || undefined,
        priceFrom: priceFrom ? Number(priceFrom) : undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
      });
      setSaveSuccess(true);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setSaveError(e.message);
      else setSaveError("Saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPortfolio(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAddingPortfolio(true);
    setPortfolioError("");
    try {
      const res = await addPortfolioItem(newUrl.trim(), newCaption.trim() || undefined);
      setPortfolio((prev) => [...prev, res.data]);
      setNewUrl("");
      setNewCaption("");
      setShowPortfolioForm(false);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setPortfolioError(e.message);
      else setPortfolioError("Qo'shishda xatolik yuz berdi.");
    } finally {
      setAddingPortfolio(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    setDeletingId(id);
    try {
      await deletePortfolioItem(id);
      setPortfolio((prev) => prev.filter((item) => item.id !== id));
      await load();
    } catch (e) {
      if (e instanceof ApiError) setPortfolioError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-primary">Profil</h1>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Completeness banner */}
      {!loading && profile && !profile.profileComplete && profile.missing.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 px-4 py-3">
          <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Buyurtma qabul qilish uchun shularni to&apos;ldiring:
            </p>
            <ul className="mt-1 list-disc list-inside text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
              {profile.missing.map((field) => (
                <li key={field}>{MISSING_LABEL[field] ?? field}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Profile form */}
      <div className="surface-card p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">Asosiy ma&apos;lumotlar</h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            {saveSuccess && (
              <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                Muvaffaqiyatli saqlandi.
              </p>
            )}
            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {saveError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="O'zingiz haqida qisqacha..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">Narx (so&apos;mdan)</label>
                <input
                  type="number"
                  min={0}
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="50000"
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">Yetkazish (kun)</label>
                <input
                  type="number"
                  min={1}
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="3"
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {saving && <Spinner size={13} />}
                Saqlash
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Portfolio */}
      <div className="surface-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Portfolio</h2>
          <button
            onClick={() => { setShowPortfolioForm(true); setPortfolioError(""); }}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={13} />
            Qo&apos;shish
          </button>
        </div>

        {portfolioError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {portfolioError}
          </p>
        )}

        {showPortfolioForm && (
          <form onSubmit={handleAddPortfolio} className="flex flex-col gap-3 rounded-xl border border-line p-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">URL (rasm yoki video)</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Tavsif (ixtiyoriy)</label>
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Loyiha haqida..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowPortfolioForm(false); setNewUrl(""); setNewCaption(""); }}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:bg-card transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={addingPortfolio}
                className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {addingPortfolio && <Spinner size={11} />}
                Qo&apos;shish
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : portfolio.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Portfolio bo&apos;sh</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {portfolio.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline truncate block"
                  >
                    {item.url}
                  </a>
                  {item.caption && (
                    <p className="text-xs text-muted truncate">{item.caption}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePortfolio(item.id)}
                  disabled={deletingId === item.id}
                  className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingId === item.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
