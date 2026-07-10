"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  fetchSettings,
  updateSettings,
  PlatformSettings,
  StaffRole,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-line last:border-0">
      <div>
        <p className="text-sm font-medium text-primary">{label}</p>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<StaffRole | "">("");
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load session client-side only (avoids SSR/hydration mismatch)
  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "SUPERADMIN") {
      router.replace("/admin");
      return;
    }
    setRole(s.role);
  }, [router]);

  const load = useCallback(async () => {
    if (!role) return;
    setLoading(true);
    setError("");
    try {
      setSettings(await fetchSettings());
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  // Render null until role is confirmed (prevents flash before redirect)
  if (!role) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">Sozlamalar</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
          Sozlamalar saqlandi.
        </p>
      )}

      <div className="surface-card p-6 max-w-xl">
        <h2 className="text-sm font-semibold text-primary mb-2">Platforma sozlamalari</h2>

        {loading || !settings ? (
          <div className="flex flex-col gap-4 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <ToggleRow
              label="Buyurtmalar ochiq"
              description="Foydalanuvchilar yangi buyurtma bera oladi"
              checked={settings.ordersOpen}
              onChange={(v) => update("ordersOpen", v)}
            />
            <ToggleRow
              label="Ro'yxatdan o'tish ochiq"
              description="Yangi foydalanuvchilar ro'yxatdan o'ta oladi"
              checked={settings.registrationOpen}
              onChange={(v) => update("registrationOpen", v)}
            />
            <ToggleRow
              label="Texnik ishlar rejimi"
              description="Sayt texnik ishlar uchun vaqtincha to'xtatiladi"
              checked={settings.maintenanceMode}
              onChange={(v) => update("maintenanceMode", v)}
            />

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 btn-neon rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving && <Spinner size={14} />}
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
