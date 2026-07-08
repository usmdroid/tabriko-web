import { get, post, patch, put, del, ApiError } from "./api";

// ─── Public Types ─────────────────────────────────────────────────────────────

export type StaffRole = "SUPERADMIN" | "MODERATOR";
export type CreatorTier = "STANDARD" | "RISING" | "TOP" | "CELEBRITY";

export interface StaffSession {
  token: string;
  role: StaffRole;
  name: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  status: "active" | "blocked";
  createdAt: string;
}

export interface AdminCreator {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  flag?: "top" | "exclusive";
  tier?: CreatorTier;
}

export interface AddCreatorRequest {
  name: string;
  phone: string;
  categoryId: number;
  tier?: CreatorTier;
  bio?: string;
  priceFrom?: number;
  deliveryDays?: number;
  passportSeries?: string;
  passportNumber?: string;
}

export interface AdminCategory {
  id: number;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  iconUrl?: string;
  archived: boolean;
}

export interface AdminCategoryRequest {
  nameUz: string;
  nameRu: string;
  nameEn: string;
  iconUrl?: string;
}

export interface AdminOccasion {
  id: number;
  title: string;
  eventDate: string;
  recurringYearly: boolean;
  emoji?: string;
  color?: string;
  imageUrl?: string;
  categoryId?: number;
  active: boolean;
  sortOrder: number;
}

export interface AdminOccasionRequest {
  title: string;
  eventDate: string;
  recurringYearly: boolean;
  emoji?: string;
  color?: string;
  imageUrl?: string;
  categoryId?: number;
  active: boolean;
  sortOrder: number;
}

export interface AdminPromotion {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  color?: string;
  categoryId?: number;
  externalUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface AdminPromotionRequest {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  color?: string;
  categoryId?: number;
  externalUrl?: string;
  active: boolean;
  sortOrder: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  creatorId: string;
  creatorName: string;
  status: "pending" | "in_progress" | "delivered" | "accepted" | "rejected" | "refunded";
  amount: number;
  createdAt: string;
}

export interface ModerationItem {
  id: number;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

export interface AdminStats {
  revenue: number;
  activeCreators: number;
  totalUsers: number;
  pendingOrders: number;
  totalOrders: number;
  moderationQueue: number;
}

export interface PlatformSettings {
  ordersOpen: boolean;
  maintenanceMode: boolean;
  registrationOpen: boolean;
}

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BackendCreatorResponse {
  id: string;
  name: string;
  category?: { id: number; name: string };
  verified: boolean;
  top: boolean;
  exclusive: boolean;
  tier?: string;
}

interface BackendOrderResponse {
  id: string;
  clientId: string;
  clientName: string;
  creatorId: string;
  creatorName: string;
  price: number | string;
  status: string;
  createdAt: string;
}

interface BackendReportResponse {
  id: number;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface BackendPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendUserResponse {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function formatDate(raw: string | number | null | undefined): string {
  if (raw == null) return "—";
  try {
    return new Date(raw).toLocaleDateString("uz-UZ");
  } catch {
    return String(raw);
  }
}

function mapOrderStatus(s: string): AdminOrder["status"] {
  const map: Record<string, AdminOrder["status"]> = {
    PENDING: "pending",
    IN_PROGRESS: "in_progress",
    DELIVERED: "delivered",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    REFUNDED: "refunded",
  };
  return map[s.toUpperCase()] ?? (s.toLowerCase() as AdminOrder["status"]);
}

function mapCreator(c: BackendCreatorResponse): AdminCreator {
  return {
    id: c.id,
    name: c.name,
    category: c.category?.name ?? "—",
    verified: c.verified,
    flag: c.top ? "top" : c.exclusive ? "exclusive" : undefined,
    tier: (c.tier as CreatorTier) ?? undefined,
  };
}

function mapOrder(o: BackendOrderResponse): AdminOrder {
  return {
    id: o.id,
    userId: o.clientId,
    userName: o.clientName ?? "—",
    creatorId: o.creatorId,
    creatorName: o.creatorName ?? "—",
    amount: Number(o.price),
    status: mapOrderStatus(o.status),
    createdAt: formatDate(o.createdAt),
  };
}

function mapUser(u: BackendUserResponse): AdminUser {
  return {
    id: u.id,
    name: u.name ?? "—",
    phone: u.phone ?? "—",
    status: (u.status as AdminUser["status"]) ?? "active",
    createdAt: formatDate(u.createdAt),
  };
}

function mapReport(r: BackendReportResponse): ModerationItem {
  return {
    id: r.id,
    reporterId: r.reporterId,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    status: (r.status as ModerationItem["status"]) ?? "OPEN",
    createdAt: formatDate(r.createdAt),
  };
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const SESSION_KEY = "admin_session";
const COOKIE_NAME = "admin_token";

export function getSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: StaffSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `${COOKIE_NAME}=${session.token}; path=/; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// ─── 401 dispatcher ───────────────────────────────────────────────────────────

function rethrow401(e: unknown): never {
  if (e instanceof ApiError && e.httpStatus === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin:401"));
  }
  throw e;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  await post("/auth/send-otp", { phone });
}

export async function login(phone: string, password: string): Promise<StaffSession> {
  const res = await post<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; phone: string; name?: string; role: string };
  }>("/auth/login", { phone, password });
  const { accessToken, user } = res.data;
  return {
    token: accessToken,
    role: user.role as StaffRole,
    name: user.name ?? user.phone,
  };
}

export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  await post("/auth/reset-password", { phone, code, newPassword });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(
  token: string,
  params?: { search?: string; status?: string },
): Promise<AdminUser[]> {
  try {
    const entries = Object.entries(params ?? {}).filter(([, v]) => v);
    const q = entries.length ? "?" + new URLSearchParams(Object.fromEntries(entries) as Record<string, string>).toString() : "";
    const res = await get<BackendUserResponse[]>(`/admin/users${q}`, token);
    return (res.data ?? []).map(mapUser);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function blockUser(token: string, id: string) {
  try {
    return await post(`/admin/users/${id}/block`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function unblockUser(token: string, id: string) {
  try {
    return await post(`/admin/users/${id}/unblock`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Creators ────────────────────────────────────────────────────────────────

export async function fetchCreators(token: string): Promise<AdminCreator[]> {
  try {
    const res = await get<BackendCreatorResponse[]>("/admin/creators", token);
    return (res.data ?? []).map(mapCreator);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function addCreator(token: string, data: AddCreatorRequest) {
  try {
    return await post("/admin/creators", data, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function verifyCreator(token: string, id: string) {
  try {
    return await post(`/admin/creators/${id}/verify`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchOrders(token: string): Promise<AdminOrder[]> {
  try {
    const res = await get<BackendPageResponse<BackendOrderResponse>>("/admin/orders?page=0&size=100", token);
    return (res.data?.content ?? []).map(mapOrder);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function fetchModeration(token: string): Promise<ModerationItem[]> {
  try {
    const res = await get<BackendPageResponse<BackendReportResponse>>("/moderation/reports?page=0&size=50", token);
    return (res.data?.content ?? []).map(mapReport);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function resolveReport(token: string, id: number) {
  try {
    return await patch(`/moderation/reports/${id}/status`, { status: "RESOLVED" }, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function dismissReport(token: string, id: number) {
  try {
    return await patch(`/moderation/reports/${id}/status`, { status: "DISMISSED" }, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchStats(token: string): Promise<AdminStats> {
  try {
    const res = await get<AdminStats>("/admin/stats", token);
    return {
      revenue: Number(res.data.revenue ?? 0),
      activeCreators: Number(res.data.activeCreators ?? 0),
      totalUsers: Number(res.data.totalUsers ?? 0),
      pendingOrders: Number(res.data.pendingOrders ?? 0),
      totalOrders: Number(res.data.totalOrders ?? 0),
      moderationQueue: Number(res.data.moderationQueue ?? 0),
    };
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(token: string): Promise<PlatformSettings> {
  try {
    const res = await get<PlatformSettings>("/admin/settings", token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updateSettings(token: string, data: Partial<PlatformSettings>) {
  try {
    return await patch("/admin/settings", data, token);
  } catch (e) {
    return rethrow401(e);
  }
}

// ─── Admin Applications ────────────────────────────────────────────────────────

export type AdminApplicationStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "INFO_REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type AdminSocialType = "TELEGRAM" | "INSTAGRAM";

export interface AdminApplicationListItem {
  id: string;
  name?: string;
  phone: string;
  activityType?: string;
  categoryName?: string;
  otherText?: string;
  socialTypes?: AdminSocialType[];
  status: AdminApplicationStatus;
  createdAt: string;
}

export interface AdminApplicationMessage {
  id: string;
  author: "APPLICANT" | "MODERATOR";
  text: string;
  fileUrl?: string;
  createdAt: string;
}

export interface AdminApplicationDetail {
  id: string;
  name?: string;
  phone: string;
  activityType?: string;
  categoryName?: string;
  otherText?: string;
  passportSeries?: string;
  passportNumber?: string;
  socialTypes?: AdminSocialType[];
  igUsername?: string;
  telegramUsername?: string;
  sampleVideoUrl?: string;
  status: AdminApplicationStatus;
  decisionReason?: string;
  igVerifyCode?: string;
  messages: AdminApplicationMessage[];
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

export async function fetchApplications(
  token: string,
  status?: string,
): Promise<AdminApplicationListItem[]> {
  try {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await get<
      { content: AdminApplicationListItem[] } | AdminApplicationListItem[]
    >(`/admin/applications${q}`, token);
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (data && !Array.isArray(data) && "content" in data) return data.content ?? [];
    return [];
  } catch (e) {
    return rethrow401(e);
  }
}

export async function fetchApplication(
  token: string,
  id: string,
): Promise<AdminApplicationDetail> {
  try {
    const res = await get<AdminApplicationDetail>(`/admin/applications/${id}`, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function reviewApplication(token: string, id: string) {
  try {
    return await post(`/admin/applications/${id}/review`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function requestApplicationInfo(token: string, id: string, message: string) {
  try {
    return await post(`/admin/applications/${id}/request-info`, { message }, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function rejectApplication(token: string, id: string, reason: string) {
  try {
    return await post(`/admin/applications/${id}/reject`, { message: reason }, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function confirmInstagram(token: string, id: string) {
  try {
    return await post(`/admin/applications/${id}/confirm-instagram`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function messageApplication(
  token: string,
  id: string,
  text: string,
  fileUrl?: string,
) {
  try {
    return await post(
      `/admin/applications/${id}/message`,
      fileUrl ? { text, fileUrl } : { text },
      token,
    );
  } catch (e) {
    return rethrow401(e);
  }
}

export async function approveApplication(token: string, id: string) {
  try {
    return await post(`/admin/applications/${id}/approve`, {}, token);
  } catch (e) {
    return rethrow401(e);
  }
}

export async function deleteApplication(token: string, id: string): Promise<void> {
  try {
    await del(`/admin/applications/${id}`, token);
  } catch (e) {
    rethrow401(e);
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminCategories(token: string): Promise<AdminCategory[]> {
  try {
    const res = await get<AdminCategory[]>("/admin/categories", token);
    return res.data ?? [];
  } catch (e) {
    return rethrow401(e);
  }
}

export async function createCategory(token: string, data: AdminCategoryRequest): Promise<AdminCategory> {
  try {
    const res = await post<AdminCategory>("/admin/categories", data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updateCategory(token: string, id: number, data: AdminCategoryRequest): Promise<AdminCategory> {
  try {
    const res = await put<AdminCategory>(`/admin/categories/${id}`, data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function archiveCategory(token: string, id: number): Promise<void> {
  try {
    await del(`/admin/categories/${id}`, token);
  } catch (e) {
    rethrow401(e);
  }
}

export async function restoreCategory(token: string, id: number): Promise<void> {
  try {
    await post(`/admin/categories/${id}/restore`, {}, token);
  } catch (e) {
    rethrow401(e);
  }
}

// ─── Occasions ─────────────────────────────────────────────────────────────────

export async function fetchOccasions(token: string): Promise<AdminOccasion[]> {
  try {
    const res = await get<AdminOccasion[]>("/admin/occasions", token);
    return res.data ?? [];
  } catch (e) {
    return rethrow401(e);
  }
}

export async function createOccasion(token: string, data: AdminOccasionRequest): Promise<AdminOccasion> {
  try {
    const res = await post<AdminOccasion>("/admin/occasions", data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updateOccasion(token: string, id: number, data: AdminOccasionRequest): Promise<AdminOccasion> {
  try {
    const res = await put<AdminOccasion>(`/admin/occasions/${id}`, data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function deleteOccasion(token: string, id: number): Promise<void> {
  try {
    await del(`/admin/occasions/${id}`, token);
  } catch (e) {
    rethrow401(e);
  }
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export async function fetchPromotions(token: string): Promise<AdminPromotion[]> {
  try {
    const res = await get<AdminPromotion[]>("/admin/promotions", token);
    return res.data ?? [];
  } catch (e) {
    return rethrow401(e);
  }
}

export async function createPromotion(token: string, data: AdminPromotionRequest): Promise<AdminPromotion> {
  try {
    const res = await post<AdminPromotion>("/admin/promotions", data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function updatePromotion(token: string, id: number, data: AdminPromotionRequest): Promise<AdminPromotion> {
  try {
    const res = await put<AdminPromotion>(`/admin/promotions/${id}`, data, token);
    return res.data;
  } catch (e) {
    return rethrow401(e);
  }
}

export async function deletePromotion(token: string, id: number): Promise<void> {
  try {
    await del(`/admin/promotions/${id}`, token);
  } catch (e) {
    rethrow401(e);
  }
}
