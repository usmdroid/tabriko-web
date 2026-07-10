"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, ArchiveX, RotateCcw, X } from "lucide-react";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  AdminCategory,
  AdminCategoryRequest,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const EMPTY_FORM: AdminCategoryRequest = { nameUz: "", nameRu: "", nameEn: "", iconUrl: "" };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<AdminCategoryRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Archive confirm modal
  const [confirmArchive, setConfirmArchive] = useState<AdminCategory | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Restore busy map
  const [restoring, setRestoring] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await getAdminCategories());
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Ma'lumot mavjud emas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalError("");
    setShowModal(true);
  }

  function openEdit(cat: AdminCategory) {
    setEditTarget(cat);
    setForm({ nameUz: cat.nameUz, nameRu: cat.nameRu, nameEn: cat.nameEn, iconUrl: cat.iconUrl ?? "" });
    setModalError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalError("");
    try {
      const payload: AdminCategoryRequest = {
        nameUz: form.nameUz.trim(),
        nameRu: form.nameRu.trim(),
        nameEn: form.nameEn.trim(),
        ...(form.iconUrl?.trim() ? { iconUrl: form.iconUrl.trim() } : {}),
      };
      if (editTarget) {
        await updateCategory(editTarget.id, payload);
      } else {
        await createCategory(payload);
      }
      setShowModal(false);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setModalError(e.message);
      else setModalError("Xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!confirmArchive) return;
    setArchiving(true);
    try {
      await archiveCategory(confirmArchive.id);
      setConfirmArchive(null);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore(cat: AdminCategory) {
    setRestoring((r) => ({ ...r, [cat.id]: true }));
    try {
      await restoreCategory(cat.id);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setRestoring((r) => ({ ...r, [cat.id]: false }));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-primary">Kategoriyalar</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 btn-neon rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={15} />
          Qo&apos;shish
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Active categories */}
      <div className="surface-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-line">
          <span className="text-sm font-medium text-primary">Faol</span>
          {!loading && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
              {active.length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Uz</th>
                <th className="px-4 py-3 font-medium">Ru</th>
                <th className="px-4 py-3 font-medium">En</th>
                <th className="px-4 py-3 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : active.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted text-xs">
                    Faol kategoriyalar yo&apos;q
                  </td>
                </tr>
              ) : (
                active.map((cat) => (
                  <tr key={cat.id} className="border-b border-line last:border-0 hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{cat.nameUz}</td>
                    <td className="px-4 py-3 text-muted">{cat.nameRu}</td>
                    <td className="px-4 py-3 text-muted">{cat.nameEn}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
                        >
                          <Pencil size={11} />
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => setConfirmArchive(cat)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                          <ArchiveX size={11} />
                          Arxivlash
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archived categories */}
      {!loading && archived.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <span className="text-sm font-medium text-primary">Arxivlangan</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 text-xs font-medium">
              {archived.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Uz</th>
                  <th className="px-4 py-3 font-medium">Ru</th>
                  <th className="px-4 py-3 font-medium">En</th>
                  <th className="px-4 py-3 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((cat) => (
                  <tr key={cat.id} className="border-b border-line last:border-0 hover:bg-card/50 transition-colors opacity-70">
                    <td className="px-4 py-3 font-medium text-primary">{cat.nameUz}</td>
                    <td className="px-4 py-3 text-muted">{cat.nameRu}</td>
                    <td className="px-4 py-3 text-muted">{cat.nameEn}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRestore(cat)}
                        disabled={restoring[cat.id]}
                        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                      >
                        {restoring[cat.id] ? <Spinner size={11} /> : <RotateCcw size={11} />}
                        Tiklash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSave}
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">
                {editTarget ? "Kategoriyani tahrirlash" : "Kategoriya qo’shish"}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {modalError}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Nomi (UZ)</label>
              <input
                type="text"
                required
                value={form.nameUz}
                onChange={(e) => setForm((f) => ({ ...f, nameUz: e.target.value }))}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Nomi (RU)</label>
              <input
                type="text"
                required
                value={form.nameRu}
                onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Nomi (EN)</label>
              <input
                type="text"
                required
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Icon URL (ixtiyoriy)</label>
              <input
                type="url"
                value={form.iconUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                placeholder="https://..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                Bekor qilish
              </button>
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
        </div>
      )}

      {/* Archive confirm modal */}
      {confirmArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmArchive(null)}
        >
          <div
            className="surface-card w-full max-w-xs p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-primary">
              &ldquo;{confirmArchive.nameUz}&rdquo; kategoriyasini arxivlashni tasdiqlaysizmi?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmArchive(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {archiving && <Spinner size={13} />}
                Arxivlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
