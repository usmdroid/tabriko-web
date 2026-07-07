"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, CheckCircle, X } from "lucide-react";
import {
  getSession,
  fetchCreators,
  addCreator,
  verifyCreator,
  AdminCreator,
  CreatorTier,
} from "@/lib/admin-api";
import { ApiError, getCategories, Category } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const FLAG_LABEL: Record<string, string> = { top: "Top", exclusive: "Exclusive" };

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

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Categories list for dropdown
  const [categories, setCategories] = useState<Category[]>([]);

  // Add creator form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [newTier, setNewTier] = useState<CreatorTier>("STANDARD");
  const [newPassportSeries, setNewPassportSeries] = useState("");
  const [newPassportNumber, setNewPassportNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Read session once (getSession parses localStorage -> new object each call, which
  // would otherwise make useCallback/useEffect deps unstable and loop).
  const session = useMemo(() => getSession(), []);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setCreators(await fetchCreators(session.token));
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

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  async function handleVerify(creator: AdminCreator) {
    if (!session) return;
    setBusy((b) => ({ ...b, [creator.id]: true }));
    try {
      await verifyCreator(session.token, creator.id);
      setCreators((prev) =>
        prev.map((c) => (c.id === creator.id ? { ...c, verified: true } : c)),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [creator.id]: false }));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!newCategoryId) {
      setAddError("Kategoriya tanlanishi shart.");
      return;
    }
    const series = newPassportSeries.trim();
    const number = newPassportNumber.trim();
    if (series || number) {
      if (!/^[A-Z]{2}$/.test(series)) {
        setAddError("Pasport seriyasi 2 ta KATTA harf bo'lishi kerak (masalan: AA).");
        return;
      }
      if (!/^[0-9]{7}$/.test(number)) {
        setAddError("Pasport raqami aynan 7 ta raqam bo'lishi kerak.");
        return;
      }
    }
    setAdding(true);
    setAddError("");
    try {
      await addCreator(session.token, {
        name: newName,
        phone: newPhone,
        categoryId: newCategoryId,
        tier: newTier,
        ...(series && number ? { passportSeries: series, passportNumber: number } : {}),
      });
      setShowAdd(false);
      setNewName("");
      setNewPhone("");
      setNewCategoryId("");
      setNewTier("STANDARD");
      setNewPassportSeries("");
      setNewPassportNumber("");
      await load();
    } catch (err) {
      if (err instanceof ApiError) setAddError(err.message);
      else setAddError("Xatolik yuz berdi.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-primary">Kreatorlar</h1>
        <button
          onClick={() => setShowAdd(true)}
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

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Ism</th>
                <th className="px-4 py-3 font-medium">Kategoriya</th>
                <th className="px-4 py-3 font-medium">Daraja</th>
                <th className="px-4 py-3 font-medium">Holati</th>
                <th className="px-4 py-3 font-medium">Flag</th>
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
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Kreatorlar topilmadi
                  </td>
                </tr>
              ) : (
                creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary">{creator.name}</td>
                    <td className="px-4 py-3 text-muted">{creator.category}</td>
                    <td className="px-4 py-3">
                      {creator.tier ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLOR[creator.tier]}`}>
                          {TIER_LABEL[creator.tier]}
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
                        {creator.verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {creator.flag ? (
                        <span className="inline-flex rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs font-medium">
                          {FLAG_LABEL[creator.flag]}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!creator.verified && (
                        <button
                          onClick={() => handleVerify(creator)}
                          disabled={busy[creator.id]}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                        >
                          {busy[creator.id] ? <Spinner size={11} /> : <CheckCircle size={11} />}
                          Tasdiqlash
                        </button>
                      )}
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
              <h2 className="text-base font-semibold text-primary">Kreator qo&apos;shish</h2>
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
              <label className="text-xs font-medium text-muted">Ism</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Telefon</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+998901234567"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Kategoriya</label>
              <select
                required
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="">— Tanlang —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-muted">Pasport seriyasi</label>
                <input
                  type="text"
                  maxLength={2}
                  value={newPassportSeries}
                  onChange={(e) => setNewPassportSeries(e.target.value.toUpperCase())}
                  placeholder="AA"
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-muted">Pasport raqami</label>
                <input
                  type="text"
                  maxLength={7}
                  value={newPassportNumber}
                  onChange={(e) => setNewPassportNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234567"
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Daraja</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as CreatorTier)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="STANDARD">Standart</option>
                <option value="RISING">O&apos;sib kelayotgan</option>
                <option value="TOP">Top</option>
                <option value="CELEBRITY">Mashhur</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors disabled:opacity-60"
              >
                {adding && <Spinner size={13} />}
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
