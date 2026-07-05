import { get, post, put, del, ApiError, ApiResponse } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatorRole = "CREATOR";

export interface CreatorSession {
  token: string;
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

const SESSION_KEY = "creatorSession";
const COOKIE_NAME = "creator_token";

export function getCreatorSession(): CreatorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CreatorSession) : null;
  } catch {
    return null;
  }
}

export function saveCreatorSession(session: CreatorSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `${COOKIE_NAME}=${session.token}; path=/; SameSite=Lax`;
}

export function clearCreatorSession() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// ─── 401 dispatcher ───────────────────────────────────────────────────────────

function rethrow401(e: unknown): never {
  if (e instanceof ApiError && e.httpStatus === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator:401"));
  }
  throw e;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  await post("/auth/send-otp", { phone });
}

export async function login(phone: string, password: string): Promise<CreatorSession> {
  const res = await post<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; phone: string; name?: string; role: string };
  }>("/auth/login", { phone, password });
  const { accessToken, user } = res.data;
  return {
    token: accessToken,
    role: user.role as CreatorRole,
    name: user.name ?? user.phone,
  };
}

export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  await post("/auth/reset-password", { phone, code, newPassword });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getCreatorProfile(token: string): Promise<CreatorProfile> {
  try {
    const res = await get<CreatorProfile>("/creator/profile", token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updateCreatorProfile(
  token: string,
  data: { bio?: string; priceFrom?: number; deliveryDays?: number },
) {
  try {
    return await put("/creator/profile", data, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolio(token: string): Promise<PortfolioItem[]> {
  try {
    const res = await get<PortfolioItem[]>("/creator/portfolio", token);
    return res.data ?? [];
  } catch (e) {
    return rethrow401(e);
  }
}

export async function addPortfolioItem(token: string, url: string, caption?: string) {
  try {
    return await post<PortfolioItem>("/creator/portfolio", { url, caption }, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function deletePortfolioItem(token: string, id: string) {
  try {
    return await del(`/creator/portfolio/${id}`, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export async function getCreatorKyc(token: string): Promise<CreatorKyc> {
  try {
    const res = await get<CreatorKyc>("/creator/kyc", token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updateCreatorKyc(
  token: string,
  data: Partial<{
    passportNumber: string;
    paymentCardNumber: string;
    paymentHolderName: string;
    telegram: string;
    instagram: string;
  }>,
) {
  try {
    return await put("/creator/kyc", data, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function uploadPassportFile(token: string, file: File): Promise<{ passportFileUrl: string }> {
  const API_BASE = (
    process.env.NEXT_PUBLIC_API_BASE ?? "https://tabriko-backend.onrender.com/api/v1"
  )
    .trim()
    .replace(/\/+$/, "");

  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/creator/kyc/passport-file`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring.");
  }

  const json: ApiResponse<CreatorKyc> = await res.json().catch(() => ({
    success: false,
    httpStatus: res.status,
    code: "PARSE_ERROR",
    message: { code: "PARSE_ERROR", text: "Javob o'qib bo'lmadi." },
    data: { passportFileUrl: "" },
  }));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.code ?? "UNKNOWN",
      json.message?.text ?? "Xatolik yuz berdi.",
    );
  }

  return { passportFileUrl: json.data.passportFileUrl ?? "" };
}
