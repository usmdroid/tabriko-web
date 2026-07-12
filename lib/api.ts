import * as Sentry from "@sentry/nextjs";

// Default points to the Render test backend (api.tabriko.uz is not live yet).
// Override per-environment via NEXT_PUBLIC_API_BASE (baked at build time).
// Whitespace and trailing slashes are stripped so an env value like
// ".../api/v1/" or ".../api/v1 " (trailing space) doesn't produce a broken
// path (".../api/v1//auth/..." or ".../api/v1%20/auth/...") that 401s.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "https://tabriko-backend.onrender.com/api/v1"
).trim().replace(/\/+$/, "");

export interface ApiMessage {
  code: string;
  text: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  httpStatus: number;
  code: string;
  message: ApiMessage;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Human-readable message for a response whose body we couldn't parse as JSON
// (empty body or an HTML gateway error page while the backend is cold-starting).
function statusMessage(status: number): string {
  if (status === 0) return "Server bilan bog'lanib bo'lmadi. Internet aloqasini tekshiring.";
  if (status === 502 || status === 503 || status === 504)
    return "Server hozircha javob bermayapti. Bir necha soniyadan so'ng qayta urinib ko'ring.";
  if (status >= 500) return "Serverda xatolik yuz berdi. Bir necha soniyadan so'ng qayta urinib ko'ring.";
  if (status === 413) return "Yuborilayotgan ma'lumot hajmi juda katta.";
  if (status >= 400) return "So'rov bajarilmadi. Ma'lumotlarni tekshirib qayta urinib ko'ring.";
  return "Kutilmagan xatolik yuz berdi.";
}

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string; jsonBody?: boolean },
): Promise<ApiResponse<T>> {
  const { token, jsonBody = true, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    // Skip Content-Type for FormData bodies (multipart uploads) so the
    // browser sets the correct multipart boundary itself.
    ...(jsonBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  } catch (err) {
    Sentry.captureException(err);
    throw new ApiError(0, "NETWORK_ERROR", "Tarmoq xatosi. Internet aloqasini tekshiring.");
  }

  const text = await res.text().catch(() => "");
  let json: ApiResponse<T>;
  if (!text.trim()) {
    // Empty body — valid for a 200/204 success; otherwise a status message.
    const code = res.ok ? "OK" : `HTTP_${res.status}`;
    json = {
      success: res.ok,
      httpStatus: res.status,
      code,
      message: { code, text: res.ok ? "OK" : statusMessage(res.status) },
      data: null as T,
    };
  } else {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      const code = `HTTP_${res.status}`;
      json = {
        success: false,
        httpStatus: res.status,
        code,
        message: { code, text: statusMessage(res.status) },
        data: null as T,
      };
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.code ?? "UNKNOWN",
      json.message?.text ?? statusMessage(res.status),
    );
  }

  return json;
}

export function get<T>(path: string, token?: string) {
  return request<T>(path, { method: "GET", token });
}

export function post<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), token });
}

export function patch<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body), token });
}

export function put<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body), token });
}

export function del<T>(path: string, token?: string) {
  return request<T>(path, { method: "DELETE", token });
}

export function postForm<T>(path: string, formData: FormData, token?: string) {
  return request<T>(path, { method: "POST", body: formData, token, jsonBody: false });
}

// ─── Creator application types ────────────────────────────────────────────────

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFO_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type ActivityType = "CATEGORY" | "OTHER";
export type SocialType = "TELEGRAM" | "INSTAGRAM";

export interface Category {
  id: number;
  name: string;
  iconUrl?: string;
}

export interface ApplicationSubmitRequest {
  phone: string;
  verifyToken: string;
  name: string;
  activityType: ActivityType;
  categoryId?: number;
  otherText?: string;
  passportSeries: string;
  passportNumber: string;
  socialTypes: SocialType[];
  igUsername?: string;
  telegramUsername?: string;
  sampleVideoUrl?: string;
}

export interface ApplicationSubmitResponse {
  applicationId: string;
  trackingToken: string;
  status: ApplicationStatus;
  igVerifyCode?: string;
  igInstructions?: string;
}

export interface ApplicationMessage {
  id: string;
  author: "APPLICANT" | "MODERATOR";
  text: string;
  fileUrl?: string;
  createdAt: string;
}

export interface ApplicationDetail {
  id: string;
  trackingToken?: string;
  status: ApplicationStatus;
  name?: string;
  phone?: string;
  activityType?: ActivityType;
  categoryName?: string;
  otherText?: string;
  passportSeries?: string;
  passportNumber?: string;
  socialTypes?: SocialType[];
  igUsername?: string;
  telegramUsername?: string;
  sampleVideoUrl?: string;
  decisionReason?: string;
  igVerifyCode?: string;
  igInstructions?: string;
  messages: ApplicationMessage[];
  verification?: {
    telegram?: {
      verified?: boolean;
      channelName?: string | null;
      channelUsername?: string | null;
      subscribers?: number | null;
      ownerStatus?: string | null;
      chatType?: string | null;
    } | null;
    instagram?: {
      username?: string;
      verifyCode?: string | null;
      ownershipConfirmed?: boolean;
    } | null;
  };
  createdAt?: string;
}

// ─── Creator application endpoints ───────────────────────────────────────────

export async function sendApplicationOtp(phone: string): Promise<void> {
  await post("/auth/send-otp", { phone });
}

export interface VerifyPhoneResult {
  verifyToken: string;
  igVerifyCode: string;
  // Present when this phone already has an active application (resume its status).
  existingApplicationId?: string;
  existingTrackingToken?: string;
}

// Whether an active application already exists for this phone (checked before OTP).
export async function applicationExists(phone: string): Promise<boolean> {
  const res = await get<{ exists: boolean }>(`/applications/exists?phone=${encodeURIComponent(phone)}`);
  return res.data.exists;
}

// Verifies the OTP immediately and exchanges it for a longer-lived verifyToken,
// so the applicant can take their time filling out the rest of the form without
// racing the OTP's short TTL. Also returns igVerifyCode so the Instagram DM text
// can be built client-side without a separate request.
export async function verifyApplicationPhone(phone: string, code: string): Promise<VerifyPhoneResult> {
  const res = await post<{
    phone: string;
    verifyToken: string;
    igVerifyCode: string;
    existingApplicationId?: string;
    existingTrackingToken?: string;
  }>("/applications/verify-phone", { phone, code });
  return {
    verifyToken: res.data.verifyToken,
    igVerifyCode: res.data.igVerifyCode,
    existingApplicationId: res.data.existingApplicationId,
    existingTrackingToken: res.data.existingTrackingToken,
  };
}

export async function getCategories(): Promise<Category[]> {
  const res = await get<Category[]>("/categories");
  return res.data ?? [];
}

export async function submitApplication(
  body: ApplicationSubmitRequest,
): Promise<ApplicationSubmitResponse> {
  const res = await post<ApplicationSubmitResponse>("/applications", body);
  return res.data;
}

export async function uploadSampleVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await postForm<{ url: string }>("/applications/upload-sample", formData);
  return res.data.url;
}

export async function getApplicationStatus(
  id: string,
  trackingToken: string,
): Promise<ApplicationDetail> {
  const res = await get<ApplicationDetail>(
    `/applications/${id}?token=${encodeURIComponent(trackingToken)}`,
  );
  return res.data;
}

export async function replyToApplication(
  id: string,
  trackingToken: string,
  text: string,
  fileUrl?: string,
): Promise<void> {
  await post(
    `/applications/${id}/reply?token=${encodeURIComponent(trackingToken)}`,
    fileUrl ? { text, fileUrl } : { text },
  );
}
