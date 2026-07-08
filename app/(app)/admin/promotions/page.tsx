"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  getSession,
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAdminCategories,
  AdminPromotion,
  AdminPromotionRequest,
  AdminCategory,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const EMPTY_FORM: AdminPromotionRequest = {
  title: "",
  subtitle: "",
  imageUrl: "",
  color: "",
  categoryId: undefined,
  externalUrl: "",
  active: true,
  sortOrder: 0,
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminPromotion | null>(null);
  const [form, setForm] = useState<AdminPromotionRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete confirm modal
  const [confirmDelete, setConfirmDelete] = useState<AdminPromotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const session = useMemo(() => getSession(), []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [promos, cats] = await Promise.all([
        fetchPromotions(session.token),
        getAdminCategories(session.token),
      ]);
      setPromotions(promos);
      setCategories(cats);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Ma'lumot mavjud emas.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = useCallback(
    (categoryId?: number) => {
      if (!categoryId) return "—";
      return categories.find((c) => c.id === categoryId)?.nameUz ?? "—";
    },
    [categories],
  );

  const activeCategories = categories.filter((c) => !c.archived);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalError("");
    setShowModal(true);
  }

  function openEdit(promo: AdminPromotion) {
    setEditTarget(promo);
    setForm({
      title: promo.title,
      subtitle: promo.subtitle ?? "",
      imageUrl: promo.imageUrl ?? "",
      color: promo.color ?? "",
      categoryId: promo.categoryId,
      externalUrl: promo.externalUrl ?? "",
      active: promo.active,
      sortOrder: promo.sortOrder,
    });
    setModalError("");
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setModalError("");
    try {
      const payload: AdminPromotionRequest = {
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        color: form.color?.trim() || undefined,
        categoryId: form.categoryId,
        externalUrl: form.externalUrl?.trim() || undefined,
        active: form.active,
        sortOrder: form.sortOrder,
      };
      if (editTarget) {
        await updatePromotion(session.token, editTarget.id, payload);
      } else {
        await createPromotion(session.token, payload);
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

  async function handleDelete() {
    if (!session || !confirmDelete) return;
    setDeleting(true);
    try {
      await deletePromotion(session.token, confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-primary">Aksiyalar</h1>
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

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Nomi</th>
                <th className="px-4 py-3 font-medium">Qo&apos;shimcha matn</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Tartib</th>
                <th className="px-4 py-3 font-medium">Kategoriya</th>
                <th className="px-4 py-3 font-medium">Amallar</th>
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
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted text-xs">
                    Aksiyalar yo&apos;q
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.id} className="border-b border-line last:border-0 hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{promo.title}</td>
                    <td className="px-4 py-3 text-muted">{promo.subtitle || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          promo.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {promo.active ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{promo.sortOrder}</td>
                    <td className="px-4 py-3 text-muted">{categoryName(promo.categoryId)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(promo)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent transition-colors"
                        >
                          <Pencil size={11} />
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => setConfirmDelete(promo)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={11} />
                          O&apos;chirish
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

      {/* Create/edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSave}
            className="surface-card w-full max-w-sm p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary">
                {editTarget ? "Aksiyani tahrirlash" : "Aksiya qo'shish"}
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
              <label className="text-xs font-medium text-muted">Nomi</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Qo&apos;shimcha matn (ixtiyoriy)</label>
              <input
                type="text"
                value={form.subtitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Masalan: 20% chegirma"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Rang (ixtiyoriy)</label>
              <input
                type="text"
                value={form.color ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="#667EEA"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Rasm URL (ixtiyoriy)</label>
              <input
                type="url"
                value={form.imageUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Tashqi havola (ixtiyoriy)</label>
              <input
                type="url"
                value={form.externalUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                placeholder="https://..."
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Kategoriya (ixtiyoriy)</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    categoryId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Kategoriyasiz</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameUz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">Bosilganda mos kategoriya bo&apos;yicha filtrlaydi.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Tartib raqami</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-line"
              />
              Faol
            </label>

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

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="surface-card w-full max-w-xs p-6 flex flex-col gap-4"
            style={{ animation: "modalIn 200ms ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-primary">
              &ldquo;{confirmDelete.title}&rdquo; aksiyasini o&apos;chirishni tasdiqlaysizmi?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting && <Spinner size={13} />}
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
