"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, verifyOtp, saveSession } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Spinner } from "@/app/components/Spinner";
import { BRAND } from "@/lib/brand";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("code");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Xatolik yuz berdi.");
      } else {
        setError("Tarmoq xatosi. Internet aloqasini tekshiring.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await verifyOtp(phone, code);
      if (session.role !== "SUPERADMIN" && session.role !== "MODERATOR") {
        setError("Kirish huquqingiz yo'q.");
        return;
      }
      saveSession(session);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Xatolik yuz berdi.");
      } else {
        setError("Tarmoq xatosi. Internet aloqasini tekshiring.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-serif text-2xl font-bold text-primary">
            {BRAND}
            <span className="text-accent">.</span>
          </span>
          <p className="mt-1 text-sm text-muted">Xodimlar paneli</p>
        </div>

        <div className="surface-card p-6 flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-primary">Kirish</h1>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="phone">
                  Telefon raqam
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Spinner size={14} />}
                {loading ? "Yuklanmoqda..." : "Kod yuborish"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <p className="text-xs text-muted">
                <span className="text-primary font-medium">{phone}</span> raqamiga SMS kod yuborildi.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="code">
                  Tasdiqlash kodi
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="1234"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Spinner size={14} />}
                {loading ? "Yuklanmoqda..." : "Kirish"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                Raqamni o&apos;zgartirish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
