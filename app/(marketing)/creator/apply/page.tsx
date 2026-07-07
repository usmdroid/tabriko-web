"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronRight, CheckCircle } from "lucide-react";
import { Spinner } from "@/app/components/Spinner";
import {
  sendApplicationOtp,
  getCategories,
  submitApplication,
  Category,
  ActivityType,
  SocialType,
  ApiError,
} from "@/lib/api";

type Phase = "phone" | "form";

const STORAGE_KEY = "creator_application";

export default function CreatorApplyPage() {
  const t = useTranslations("creatorApply");
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("phone");
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Form fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [otherText, setOtherText] = useState("");
  const [socialType, setSocialType] = useState<SocialType | "">("");
  const [igUsername, setIgUsername] = useState("");
  const [sampleVideoUrl, setSampleVideoUrl] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (phase === "form" && categories.length === 0) {
      setLoadingCategories(true);
      getCategories()
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoadingCategories(false));
    }
  }, [phase, categories.length]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setSendingOtp(true);
    setOtpError("");
    try {
      await sendApplicationOtp(phone.trim());
      setPhase("form");
    } catch (err) {
      if (err instanceof ApiError) setOtpError(err.message);
      else setOtpError(t("loadError"));
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityType || !socialType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitApplication({
        phone: phone.trim(),
        code: code.trim(),
        name: name.trim() || undefined,
        activityType,
        categoryId: activityType === "CATEGORY" && categoryId !== "" ? Number(categoryId) : undefined,
        otherText: activityType === "OTHER" ? otherText.trim() || undefined : undefined,
        socialType,
        igUsername: socialType === "INSTAGRAM" ? igUsername.trim().replace(/^@/, "") || undefined : undefined,
        sampleVideoUrl: sampleVideoUrl.trim() || undefined,
      });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ applicationId: res.applicationId, trackingToken: res.trackingToken }),
      );
      router.push("/creator/apply/status");
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err.message);
      else setSubmitError(t("loadError"));
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
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            {otpError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {otpError}
              </p>
            )}

            <button
              type="submit"
              disabled={sendingOtp || !phone.trim()}
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
          {/* OTP code */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("otpLabel")}</label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("otpPlaceholder")}
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-muted">{t("otpHint")}</p>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("nameLabel")}</label>
            <input
              type="text"
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

          {/* Instagram username */}
          {socialType === "INSTAGRAM" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">{t("igUsernameLabel")}</label>
              <input
                type="text"
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
                placeholder={t("igUsernamePlaceholder")}
                className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {/* Sample video */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">{t("sampleVideoLabel")}</label>
            <input
              type="url"
              value={sampleVideoUrl}
              onChange={(e) => setSampleVideoUrl(e.target.value)}
              placeholder={t("sampleVideoPlaceholder")}
              className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-muted">{t("sampleVideoHint")}</p>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !code.trim() || !activityType || !socialType}
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
