import { post, ApiError } from "./api";
import { authGet, authPut, authPost, authDel, authPostForm } from "./auth-fetch";
import { getSession as getSessionInfo, saveSession as saveSessionInfo, clearSession as clearSessionInfo, type SessionInfo } from "./session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatorRole = "CREATOR";

export interface CreatorSession {
  role: CreatorRole;
  name: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  bio: string;
  priceFrom: number;
  deliveryDays: number;
  profileComplete: boolean;
  missing: string[];
}

export interface PortfolioItem {
  id: string;
  url: string;
  caption?: string;
}

export interface CreatorKyc {
  passportNumber?: string;
  passportFileUrl?: string;
  paymentCardNumber?: string;
  paymentHolderName?: string;
  telegram?: string;
  instagram?: string;
}

// ─── Session helpers ──────────────────────────────────────────────────────────
// Session info (name + role only) lives in localStorage via lib/session.ts;
// the access/refresh tokens live in HttpOnly cookies set by /api/session/*.

export function getCreatorSession(): CreatorSession | null {
  const info = getSessionInfo("creator");
  return info ? { role: info.role as CreatorRole, name: info.name } : null;
}

export function saveCreatorSession(session: CreatorSession): void {
  saveSessionInfo("creator", session as SessionInfo);
}

export function clearCreatorSession(): Promise<void> {
  return clearSessionInfo("creator");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  await post("/auth/send-otp", { phone });
}

export async function login(phone: string, password: string): Promise<CreatorSession> {
  const res = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password, scope: "creator" }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data) {
    throw new ApiError(res.status, json?.code ?? "UNKNOWN", json?.message?.text ?? "Xatolik yuz berdi.");
  }
  return json.data as CreatorSession;
}

export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  await post("/auth/reset-password", { phone, code, newPassword });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getCreatorProfile(): Promise<CreatorProfile> {
  const res = await authGet<CreatorProfile>("creator", "/creator/profile");
  return res.data;
}

export async function updateCreatorProfile(data: { bio?: string; priceFrom?: number; deliveryDays?: number }) {
  return authPut("creator", "/creator/profile", data);
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolio(): Promise<PortfolioItem[]> {
  const res = await authGet<PortfolioItem[]>("creator", "/creator/portfolio");
  return res.data ?? [];
}

export async function addPortfolioItem(url: string, caption?: string) {
  return authPost<PortfolioItem>("creator", "/creator/portfolio", { url, caption });
}

export async function deletePortfolioItem(id: string) {
  return authDel("creator", `/creator/portfolio/${id}`);
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export async function getCreatorKyc(): Promise<CreatorKyc> {
  const res = await authGet<CreatorKyc>("creator", "/creator/kyc");
  return res.data;
}

export async function updateCreatorKyc(
  data: Partial<{
    passportNumber: string;
    paymentCardNumber: string;
    paymentHolderName: string;
    telegram: string;
    instagram: string;
  }>,
) {
  return authPut("creator", "/creator/kyc", data);
}

export async function uploadPassportFile(file: File): Promise<{ passportFileUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authPostForm<CreatorKyc>("creator", "/creator/kyc/passport-file", formData);
  return { passportFileUrl: res.data.passportFileUrl ?? "" };
}
