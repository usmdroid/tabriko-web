"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Eye, EyeOff, Upload } from "lucide-react";
import {
  getCreatorSession,
  getCreatorKyc,
  updateCreatorKyc,
  uploadPassportFile,
  CreatorKyc,
} from "@/lib/creator-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

export default function CreatorKycPage() {
  const session = useMemo(() => getCreatorSession(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kyc, setKyc] = useState<CreatorKyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form fields
  const [passportNumber, setPassportNumber] = useState("");
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentHolderName, setPaymentHolderName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const [showPassport, setShowPassport] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const data = await getCreatorKyc(session.token);
      setKyc(data);
      setPassportNumber(data.passportNumber ?? "");
      setPaymentCardNumber(data.paymentCardNumber ?? "");
      setPaymentHolderName(data.paymentHolderName ?? "");
      setTelegram(data.telegram ?? "");
      setInstagram(data.instagram ?? "");
      if (data.passportFileUrl) setUploadedUrl(data.passportFileUrl);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Ma'lumot yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateCreatorKyc(session.token, {
        passportNumber: passportNumber || undefined,
        paymentCardNumber: paymentCardNumber || undefined,
        paymentHolderName: paymentHolderName || undefined,
        telegram: telegram || undefined,
        instagram: instagram || undefined,
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    setUploadError("");
    try {
      const result = await uploadPassportFile(session.token, file);
      setUploadedUrl(result.passportFileUrl);
    } catch (err) {
      if (err instanceof ApiError) setUploadError(err.message);
      else setUploadError("Fayl yuklab bo'lmadi.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">KYC / Shaxsiy ma&apos;lumot</h1>
        <p className="mt-1 text-xs text-muted">
          Xavfsizlik maqsadida saqlangan qiymatlar yashirilgan holda ko&apos;rsatiladi.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="surface-card p-5 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Passport section */}
          <div className="surface-card p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-primary">Pasport / ID</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Pasport raqami</label>
              <div className="relative">
                <input
                  type={showPassport ? "text" : "password"}
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder={kyc?.passportNumber ? "••••••••" : "AA1234567"}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-9 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassport((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showPassport ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {kyc?.passportNumber && (
                <p className="text-xs text-muted">
                  Saqlangan: <span className="font-mono">{kyc.passportNumber}</span>{" "}
                  <span className="text-yellow-600 dark:text-yellow-400">(yashirilgan)</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Pasport rasmi (fayl)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="passport-file"
                />
                <label
                  htmlFor="passport-file"
                  className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                  {uploading ? <Spinner size={13} /> : <Upload size={13} />}
                  {uploading ? "Yuklanmoqda..." : "Fayl tanlash"}
                </label>
                {uploadedUrl && (
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline truncate max-w-[160px]"
                  >
                    Yuklangan fayl
                  </a>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Payment section */}
          <div className="surface-card p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-primary">To&apos;lov rekvizitlari</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Karta raqami</label>
              <div className="relative">
                <input
                  type={showCard ? "text" : "password"}
                  value={paymentCardNumber}
                  onChange={(e) => setPaymentCardNumber(e.target.value)}
                  placeholder={kyc?.paymentCardNumber ? "••••••••••••••••" : "8600 0000 0000 0000"}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-9 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowCard((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                >
                  {showCard ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {kyc?.paymentCardNumber && (
                <p className="text-xs text-muted">
                  Saqlangan: <span className="font-mono">{kyc.paymentCardNumber}</span>{" "}
                  <span className="text-yellow-600 dark:text-yellow-400">(yashirilgan)</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Karta egasi ismi</label>
              <input
                type="text"
                value={paymentHolderName}
                onChange={(e) => setPaymentHolderName(e.target.value)}
                placeholder="FIRSTNAME LASTNAME"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent uppercase"
              />
            </div>
          </div>

          {/* Social section */}
          <div className="surface-card p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-primary">Ijtimoiy tarmoqlar</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Telegram (username)</label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">Instagram (username)</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 btn-neon rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <Spinner size={13} />}
              Saqlash
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
