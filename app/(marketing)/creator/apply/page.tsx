"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronRight, CheckCircle, ExternalLink, Upload, X, Copy, Check } from "lucide-react";
import { Spinner } from "@/app/components/Spinner";
import {
  sendApplicationOtp,
  verifyApplicationPhone,
  getCategories,
  submitApplication,
  uploadSampleVideo,
  Category,
  ActivityType,
  SocialType,
  ApiError,
} from "@/lib/api";

type Phase = "phone" | "verify" | "details";

const STORAGE_KEY = "creator_application";
const TELEGRAM_BOT_URL = "https://t.me/tabrikoverifybot";
const MAX_SAMPLE_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_SAMPLE_VIDEO_SECONDS = 120;
const OTP_LENGTH = 4;

// Central Asian country codes — dropdown + per-country digit count for masking/validation.
const COUNTRY_CODES = [
  { code: "998", flag: "🇺🇿", label: "O'zbekiston", digits: 9, example: "90 123 45 67" },
  { code: "7", flag: "🇰🇿", label: "Qozog'iston", digits: 10, example: "701 234 56 78" },
  { code: "996", flag: "🇰🇬", label: "Qirg'iziston", digits: 9, example: "700 123 456" },
  { code: "992", flag: "🇹🇯", label: "Tojikiston", digits: 9, example: "92 123 4567" },
  { code: "993", flag: "🇹🇲", label: "Turkmaniston", digits: 8, example: "65 123456" },
] as const;

export default function CreatorApplyPage() {
  const t = useTranslations("creatorApply");
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("phone");
  const [countryCode, setCountryCode] = useState<string>(COUNTRY_CODES[0].code);
  const [localNumber, setLocalNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Phone verification (OTP is confirmed right away, before the rest of the form)
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [igVerifyCode, setIgVerifyCode] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [otherText, setOtherText] = useState("");
  const [socialType, setSocialType] = useState<SocialType | "">("");
  const [igUsername, setIgUsername] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Instagram DM verification text (built client-side, shown + copyable before submit)
  const [igCopied, setIgCopied] = useState(false);

  // Sample video (file upload, not a URL)
  const [sampleVideoFile, setSampleVideoFile] = useState<File | null>(null);
  const [sampleVideoUrl, setSampleVideoUrl] = useState("");
  const [sampleVideoUploading, setSampleVideoUploading] = useState(false);
  const [sampleVideoError, setSampleVideoError] = useState("");

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];
  const phoneValid = localNumber.length === selectedCountry.digits;

  const activityLabel =
    activityType === "OTHER" ? otherText.trim() : categories.find((c) => c.id === categoryId)?.name ?? "";
  const igDisplayText = igVerifyCode ? `${name.trim()} (${activityLabel}) - ${igVerifyCode}` : "";

  useEffect(() => {
    if (phase === "details" && categories.length === 0) {
      setLoadingCategories(true);
      getCategories()
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoadingCategories(false));
    }
  }, [phase, categories.length]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneValid) return;
    const fullPhone = `+${countryCode}${localNumber}`;
    setSendingOtp(true);
    setOtpError("");
    try {
      await sendApplicationOtp(fullPhone);
      setPhone(fullPhone);
      setPhase("verify");
    } catch (err) {
      if (err instanceof ApiError) setOtpError(err.message);
      else setOtpError(t("loadError"));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (verifyCode.length !== OTP_LENGTH) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const { verifyToken: token, igVerifyCode: code } = await verifyApplicationPhone(phone, verifyCode);
      setVerifyToken(token);
      setIgVerifyCode(code);
      setPhase("details");
    } catch (err) {
      if (err instanceof ApiError) setVerifyError(err.message);
      else setVerifyError(t("loadError"));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendCode() {
    setVerifyError("");
    setVerifyCode("");
    try {
      await sendApplicationOtp(phone);
    } catch (err) {
      if (err instanceof ApiError) setVerifyError(err.message);
      else setVerifyError(t("loadError"));
    }
  }

  async function handleCopyIgText() {
    try {
      await navigator.clipboard.writeText(igDisplayText);
      setIgCopied(true);
      setTimeout(() => setIgCopied(false), 2000);
    } catch {
      // clipboard API unavailable — ignore, the text is still selectable
    }
  }

  async function handleSampleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSampleVideoError("");
    setSampleVideoUrl("");
    setSampleVideoFile(null);

    if (file.size > MAX_SAMPLE_VIDEO_BYTES) {
      setSampleVideoError(t("sampleVideoTooLarge"));
      return;
    }

    const duration = await new Promise<number | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });

    if (duration !== null && duration > MAX_SAMPLE_VIDEO_SECONDS) {
      setSampleVideoError(t("sampleVideoTooLong"));
      return;
    }

    setSampleVideoFile(file);
    setSampleVideoUploading(true);
    try {
      const url = await uploadSampleVideo(file);
      setSampleVideoUrl(url);
    } catch (err) {
      if (err instanceof ApiError) setSampleVideoError(err.message);
      else setSampleVideoError(t("loadError"));
      setSampleVideoFile(null);
    } finally {
      setSampleVideoUploading(false);
    }
  }

  function handleRemoveSampleVideo() {
    setSampleVideoFile(null);
    setSampleVideoUrl("");
    setSampleVideoError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityType || !socialType || !name.trim() || sampleVideoUploading) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitApplication({
        phone: phone.trim(),
        verifyToken,
        name: name.trim(),
        activityType,
        categoryId: activityType === "CATEGORY" && categoryId !== "" ? Number(categoryId) : undefined,
        otherText: activityType === "OTHER" ? otherText.trim() || undefined : undefined,
        socialType,
        igUsername: socialType === "INSTAGRAM" ? igUsername.trim().replace(/^@/, "") || undefined : undefined,
        telegramUsername: socialType === "TELEGRAM" ? telegramUsername.trim().replace(/^@/, "") || undefined : undefined,
        sampleVideoUrl: sampleVideoUrl || undefined,
      });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ applicationId: res.applicationId, trackingToken: res.trackingToken }),
      );
      router.push("/creator/apply/status");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        // The verifyToken expired or was already used — bounce back to re-verify.
        if (err.httpStatus === 400 && /verif/i.test(err.message)) {
          setPhase("verify");
          setVerifyToken("");
          setVerifyCode("");
        }
      } else {
        setSubmitError(t("loadError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "phone") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t("pageTitle")}</h1>
          <p className="text-sm text-muted mb-8">{t("step1Desc")}</p>

          <form onSubmit={handleSendOtp} className="surface-card p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("step1Heading")}</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setLocalNumber("");
                  }}
                  className="rounded-lg border border-line bg-surface px-2 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} +{c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  value={localNumber}
                  onChange={(e) =>
                    setLocalNumber(e.target.value.replace(/\D/g, "").slice(0, selectedCountry.digits))
                  }
                  placeholder={selectedCountry.example}
                  className="flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              {localNumber.length > 0 && !phoneValid && (
                <p className="text-xs text-red-500">
                  {t("phoneDigitsCount", { count: selectedCountry.digits })}
                </p>
              )}
            </div>

            {otpError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {otpError}
              </p>
            )}

            <button
              type="submit"
              disabled={sendingOtp || !phoneValid}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-hover transition-colors disabled:opacity-60"
            >
              {sendingOtp ? <Spinner size={14} /> : <ChevronRight size={14} />}
              {t("sendOtpBtn")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === "verify") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <button
            onClick={() => setPhase("phone")}
            className="text-sm text-muted hover:text-primary transition-colors mb-6"
          >
            {t("backToPhone")}
          </button>

          <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t("pageTitle")}</h1>
          <p className="text-sm text-muted mb-8">{t("verifyStepDesc", { phone })}</p>

          <form onSubmit={handleVerifyCode} className="surface-card p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("otpLabel")}</label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                placeholder={t("otpPlaceholder")}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-lg tracking-[0.5em] text-primary focus:outline-none focus:border-accent"
                autoFocus
              />
              <p className="text-xs text-muted">{t("otpHint")}</p>
            </div>

            {verifyError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {verifyError}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying || verifyCode.length !== OTP_LENGTH}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-hover transition-colors disabled:opacity-60"
            >
              {verifying ? <Spinner size={14} /> : <CheckCircle size={14} />}
              {t("verifyBtn")}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              {t("resendCode")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] px-4 py-16">
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => setPhase("phone")}
          className="text-sm text-muted hover:text-primary transition-colors mb-6"
        >
          {t("backToPhone")}
        </button>

        <h1 className="font-serif text-2xl font-bold text-primary mb-1">{t("pageTitle")}</h1>
        <p className="text-sm text-muted mb-8">{t("step2Heading")}</p>

        <form onSubmit={handleSubmit} className="surface-card p-6 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("nameLabel")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Activity type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("activityTypeLabel")}</label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 py-2">
                <Spinner size={13} className="text-accent" />
                <span className="text-xs text-muted">{t("loading")}</span>
              </div>
            ) : (
              <select
                required
                value={activityType === "OTHER" ? "OTHER" : String(categoryId)}
                onChange={(e) => {
                  if (e.target.value === "OTHER") {
                    setActivityType("OTHER");
                    setCategoryId("");
                  } else if (e.target.value === "") {
                    setActivityType("");
                    setCategoryId("");
                  } else {
                    setActivityType("CATEGORY");
                    setCategoryId(Number(e.target.value));
                  }
                }}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="">{t("selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
                <option value="OTHER">{t("otherActivity")}</option>
              </select>
            )}
          </div>

          {/* Other text */}
          {activityType === "OTHER" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("otherTextLabel")}</label>
              <textarea
                required
                rows={2}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={t("otherTextPlaceholder")}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
          )}

          {/* Social network */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted">{t("socialTypeLabel")}</label>
            <div className="flex gap-3">
              {(["TELEGRAM", "INSTAGRAM"] as SocialType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSocialType(type)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    socialType === type
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line bg-surface text-muted hover:border-accent/50"
                  }`}
                >
                  {type === "TELEGRAM" ? t("telegramLabel") : t("instagramLabel")}
                </button>
              ))}
            </div>
          </div>

          {/* Telegram username + bot instructions */}
          {socialType === "TELEGRAM" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">{t("tgUsernameLabel")}</label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder={t("tgUsernamePlaceholder")}
                  className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="rounded-xl bg-card p-4">
                <p className="text-sm font-semibold text-primary mb-2">{t("tgInstructionsTitle")}</p>
                <ol className="text-xs text-muted list-decimal list-inside space-y-1 mb-3">
                  <li>{t("tgStep1", { phone })}</li>
                  <li>{t("tgStep2")}</li>
                  <li>{t("tgStep3")}</li>
                  <li>{t("tgStep4")}</li>
                </ol>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2AABEE] px-4 py-2 text-sm font-medium text-white hover:bg-[#229ED9] transition-colors"
                >
                  {t("telegramOpenBot")}
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Instagram username + DM instructions */}
          {socialType === "INSTAGRAM" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">{t("igUsernameLabel")}</label>
                <input
                  type="text"
                  required
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                  placeholder={t("igUsernamePlaceholder")}
                  className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="rounded-xl bg-card p-4">
                <p className="text-xs text-muted mb-3">{t("igCopyInstructions")}</p>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
                  <span className="text-sm text-primary select-all">{igDisplayText}</span>
                  <button
                    type="button"
                    onClick={handleCopyIgText}
                    className="shrink-0 flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-primary hover:border-accent/50 transition-colors"
                  >
                    {igCopied ? <Check size={12} /> : <Copy size={12} />}
                    {igCopied ? t("copied") : t("copyBtn")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sample video */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("sampleVideoLabel")}</label>

            {!sampleVideoFile && !sampleVideoUploading && (
              <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface px-3 py-4 text-sm text-muted cursor-pointer hover:border-accent/50 transition-colors">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="hidden"
                  onChange={handleSampleVideoChange}
                />
                <Upload size={15} />
                {t("sampleVideoChoose")}
              </label>
            )}

            {sampleVideoUploading && (
              <div className="flex items-center gap-2 py-2">
                <Spinner size={13} className="text-accent" />
                <span className="text-xs text-muted">{t("sampleVideoUploading")}</span>
              </div>
            )}

            {sampleVideoFile && !sampleVideoUploading && (
              <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary">
                <span className="truncate">{sampleVideoFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveSampleVideo}
                  className="shrink-0 ml-2 text-muted hover:text-red-500 transition-colors"
                  aria-label={t("sampleVideoRemove")}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {sampleVideoError && <p className="text-xs text-red-500">{sampleVideoError}</p>}
            <p className="text-xs text-muted">{t("sampleVideoHint")}</p>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              sampleVideoUploading ||
              !name.trim() ||
              !activityType ||
              !socialType
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-hover transition-colors disabled:opacity-60"
          >
            {submitting ? <Spinner size={14} /> : <CheckCircle size={14} />}
            {submitting ? t("submitting") : t("submitBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
