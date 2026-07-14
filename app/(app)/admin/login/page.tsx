"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { login, sendOtp, resetPassword, saveSession } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatUzPhoneInput, normalizeUzPhone } from "@/lib/phone";
import { Spinner } from "@/app/components/Spinner";
import { BRAND } from "@/lib/brand";

type Step = "login" | "reset-phone" | "reset-code";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("admin.login");
  const [step, setStep] = useState<Step>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  function handleApiError(err: unknown) {
    if (err instanceof ApiError) {
      setError(err.message || t("genericError"));
    } else {
      setError(t("networkError"));
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(normalizeUzPhone(phone), password);
      saveSession(session);
      router.replace("/admin");
    } catch (err) {
      handleApiError(err);
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
      handleApiError(err);
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
      handleApiError(err);
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
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <div className="surface-card p-6 flex flex-col gap-4">
          <h1 className="text-lg font-semibold text-primary">
            {step === "login" ? t("loginTitle") : t("resetTitle")}
          </h1>

          {resetSuccess && step === "login" && (
            <p className="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              {t("resetSuccess")}
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
                  {t("phoneLabel")}
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
                  {t("passwordLabel")}
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
                {loading ? t("loading") : t("loginBtn")}
              </button>

              <button
                type="button"
                onClick={() => { setResetPhone(phone); setError(""); setResetSuccess(false); setStep("reset-phone"); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                {t("forgotPassword")}
              </button>
            </form>
          )}

          {step === "reset-phone" && (
            <form onSubmit={handleSendResetOtp} className="flex flex-col gap-4">
              <p className="text-xs text-muted">
                {t("resetPhoneDesc")}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="reset-phone">
                  {t("phoneLabel")}
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
                {loading ? t("loading") : t("sendCodeBtn")}
              </button>

              <button
                type="button"
                onClick={() => { setStep("login"); setError(""); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                {t("backToLogin")}
              </button>
            </form>
          )}

          {step === "reset-code" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <p className="text-xs text-muted">
                {t("codeSentTo", { phone: resetPhone })}
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted" htmlFor="code">
                  {t("codeLabel")}
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
                  {t("newPasswordLabel")}
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
                {loading ? t("loading") : t("setPasswordBtn")}
              </button>

              <button
                type="button"
                onClick={() => { setStep("reset-phone"); setCode(""); setError(""); }}
                className="text-xs text-muted hover:text-primary transition-colors text-center"
              >
                {t("changePhone")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
