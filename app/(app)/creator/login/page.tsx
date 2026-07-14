"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, sendOtp, resetPassword, saveCreatorSession } from "@/lib/creator-api";
import { ApiError } from "@/lib/api";
import { formatUzPhoneInput, normalizeUzPhone } from "@/lib/phone";
import { Spinner } from "@/app/components/Spinner";
import { BRAND } from "@/lib/brand";

type Step = "login" | "reset-phone" | "reset-code";

export default function CreatorLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(normalizeUzPhone(phone), password);
      saveCreatorSession(session);
      router.replace("/creator");
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

  async function handleSendResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendOtp(normalizeUzPhone(resetPhone));
      setStep("reset-code");
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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(normalizeUzPhone(resetPhone), code, newPassword);
      setResetSuccess(true);
      setPhone(resetPhone);
      setPassword("");
      setCode("");
      setNewPassword("");
      setStep("login");
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
          <p className="mt-1 text-sm text-muted">Kreator paneli</p>
        </div>

        <div className="surface-card p-6 flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-primary">
            {step === "login" ? "Kirish" : "Parolni o'rnatish"}
          </h1>

          {resetSuccess && step === "login" && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              Parol muvaffaqiyatli o&apos;rnatildi. Endi kiring.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {step === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="phone">
                  Telefon raqam
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatUzPhoneInput(e.target.value))}
                  placeholder="+998 90 123 45 67"
                  required
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="password">
                  Parol
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
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
                onClick={() => { setResetPhone(phone); setError(""); setResetSuccess(false); setStep("reset-phone"); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                Parolni o&apos;rnatish / unutdim
              </button>
            </form>
          )}

          {step === "reset-phone" && (
            <form onSubmit={handleSendResetOtp} className="flex flex-col gap-4">
              <p className="text-xs text-muted">
                Telefon raqamingizni kiriting. SMS kod yuboriladi.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="reset-phone">
                  Telefon raqam
                </label>
                <input
                  id="reset-phone"
                  type="tel"
                  autoComplete="tel"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(formatUzPhoneInput(e.target.value))}
                  placeholder="+998 90 123 45 67"
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

              <button
                type="button"
                onClick={() => { setStep("login"); setError(""); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                Kirishga qaytish
              </button>
            </form>
          )}

          {step === "reset-code" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <p className="text-xs text-muted">
                <span className="text-primary font-medium">{resetPhone}</span> raqamiga SMS kod yuborildi.
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="new-password">
                  Yangi parol (≥ 6 belgi)
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon mt-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Spinner size={14} />}
                {loading ? "Yuklanmoqda..." : "Parolni o'rnatish"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("reset-phone"); setCode(""); setError(""); }}
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
