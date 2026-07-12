import { post, ApiError } from "./api";
import { authGet, authPost, authPatch, authPut, authDel } from "./auth-fetch";
import { getSession as getSessionInfo, saveSession as saveSessionInfo, clearSession as clearSessionInfo, type SessionInfo } from "./session";
import { getCurrentLocale, INTL_LOCALE_TAG } from "./locale";

// ─── Public Types ─────────────────────────────────────────────────────────────

export type StaffRole = "SUPERADMIN" | "MODERATOR";
export type CreatorTier = "STANDARD" | "RISING" | "TOP" | "CELEBRITY";

export interface StaffSession {
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

export interface AdminDevice {
  id: string;
  platform: string;
  appVersion: string;
  deviceName: string;
  osVersion: string;
  updatedAt: string;
  rooted: boolean;
  genuine: boolean;
  blocked: boolean;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: "active" | "blocked";
  createdAt: string;
  devices: AdminDevice[];
}

export interface AdminCreatorContact {
  id: string;
  phone: string;
  label: string | null;
  createdAt: string;
}

export interface AdminCreator {
  id: string;
  name: string;
  phone: string;
  category: string;
  verified: boolean;
  flag?: "top" | "exclusive";
  tier?: CreatorTier;
  contacts: AdminCreatorContact[];
  accountStatus?: string;
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
  blockRootedDevices: boolean;
}

// ─── Backend response shapes ──────────────────────────────────────────────────

interface BackendCreatorResponse {
  id: string;
  name: string;
  phone: string;
  category?: { id: number; name: string };
  verified: boolean;
  top: boolean;
  exclusive: boolean;
  tier?: string;
  status?: string;
  contacts?: AdminCreatorContact[];
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

interface BackendUserDetailResponse {
  id: string;
  name: string;
  phone: string;
  role?: string;
  status: string;
  createdAt: string;
  devices?: Array<{
    id: string;
    platform?: string;
    appVersion?: string;
    deviceName?: string;
    osVersion?: string;
    updatedAt?: string;
    rooted?: boolean;
    genuine?: boolean;
    blocked?: boolean;
  }>;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function formatDate(raw: string | number | null | undefined): string {
  if (raw == null) return "—";
  try {
    return new Date(raw).toLocaleDateString(INTL_LOCALE_TAG[getCurrentLocale()]);
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
    phone: c.phone ?? "—",
    category: c.category?.name ?? "—",
    verified: c.verified,
    flag: c.top ? "top" : c.exclusive ? "exclusive" : undefined,
    tier: (c.tier as CreatorTier) ?? undefined,
    contacts: c.contacts ?? [],
    accountStatus: c.status,
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

function mapUserDetail(u: BackendUserDetailResponse): AdminUserDetail {
  return {
    id: u.id,
    name: u.name ?? "—",
    phone: u.phone ?? "—",
    role: u.role ?? "—",
    status: u.status?.toLowerCase() === "active" ? "active" : "blocked",
    createdAt: formatDate(u.createdAt),
    devices: (u.devices ?? []).map((d) => ({
      id: d.id,
      platform: d.platform ?? "—",
      appVersion: d.appVersion ?? "—",
      deviceName: d.deviceName ?? "—",
      osVersion: d.osVersion ?? "—",
      updatedAt: formatDate(d.updatedAt),
      rooted: d.rooted ?? false,
      genuine: d.genuine ?? true,
      blocked: d.blocked ?? false,
    })),
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
// Session info (name + role only) lives in localStorage via lib/session.ts;
// the access/refresh tokens live in HttpOnly cookies set by /api/session/*.

export function getSession(): StaffSession | null {
  const info = getSessionInfo("admin");
  return info ? { role: info.role as StaffRole, name: info.name } : null;
}

export function saveSession(session: StaffSession): void {
  saveSessionInfo("admin", session as SessionInfo);
}

export function clearSession(): Promise<void> {
  return clearSessionInfo("admin");
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  await post("/auth/send-otp", { phone });
}

export async function login(phone: string, password: string): Promise<StaffSession> {
  const res = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password, scope: "admin" }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data) {
    throw new ApiError(res.status, json?.code ?? "UNKNOWN", json?.message?.text ?? "Xatolik yuz berdi.");
  }
  return json.data as StaffSession;
}

export async function resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
  await post("/auth/reset-password", { phone, code, newPassword });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(
  params?: { search?: string; status?: string },
  signal?: AbortSignal,
): Promise<AdminUser[]> {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v);
  const q = entries.length ? "?" + new URLSearchParams(Object.fromEntries(entries) as Record<string, string>).toString() : "";
  const res = await authGet<BackendUserResponse[]>("admin", `/admin/users${q}`, signal);
  return (res.data ?? []).map(mapUser);
}

export async function blockUser(id: string) {
  return authPost("admin", `/admin/users/${id}/block`, {});
}

export async function unblockUser(id: string) {
  return authPost("admin", `/admin/users/${id}/unblock`, {});
}

export async function fetchUser(
  id: string,
  signal?: AbortSignal,
): Promise<AdminUserDetail> {
  const res = await authGet<BackendUserDetailResponse>("admin", `/admin/users/${id}`, signal);
  return mapUserDetail(res.data as BackendUserDetailResponse);
}

export interface NotifyResult {
  targeted: number;
  delivered: number;
  failed: number;
}

export async function sendUserNotification(
  id: string,
  payload: { title: string; body: string; deviceIds?: string[] },
): Promise<NotifyResult | null> {
  const res = await authPost<NotifyResult>("admin", `/admin/users/${id}/notify`, payload);
  return res.data ?? null;
}

export async function blockDevice(deviceId: string) {
  return authPost("admin", `/admin/devices/${deviceId}/block`, {});
}

export async function unblockDevice(deviceId: string) {
  return authPost("admin", `/admin/devices/${deviceId}/unblock`, {});
}

// ─── Creators ────────────────────────────────────────────────────────────────

export async function fetchCreators(signal?: AbortSignal): Promise<AdminCreator[]> {
  const res = await authGet<BackendCreatorResponse[]>("admin", "/admin/creators", signal);
  return (res.data ?? []).map(mapCreator);
}

export async function addCreator(data: AddCreatorRequest) {
  return authPost("admin", "/admin/creators", data);
}

export async function verifyCreator(id: string) {
  return authPost("admin", `/admin/creators/${id}/verify`, {});
}

export async function fetchCreator(id: string, signal?: AbortSignal): Promise<AdminCreator> {
  const res = await authGet<BackendCreatorResponse>("admin", `/admin/creators/${id}`, signal);
  return mapCreator(res.data as BackendCreatorResponse);
}

export async function fetchCreatorDetail(id: string, signal?: AbortSignal): Promise<AdminCreator> {
  const res = await authGet<BackendCreatorResponse>("admin", `/admin/creators/${id}`, signal);
  return mapCreator(res.data as BackendCreatorResponse);
}

export async function addCreatorContact(id: string, data: { phone: string; label?: string }): Promise<AdminCreatorContact> {
  const res = await authPost<AdminCreatorContact>("admin", `/admin/creators/${id}/contacts`, data);
  return res.data;
}

export async function deleteCreatorContact(id: string, contactId: string): Promise<void> {
  await authDel("admin", `/admin/creators/${id}/contacts/${contactId}`);
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchOrders(signal?: AbortSignal): Promise<AdminOrder[]> {
  const res = await authGet<BackendPageResponse<BackendOrderResponse>>("admin", "/admin/orders?page=0&size=100", signal);
  return (res.data?.content ?? []).map(mapOrder);
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function fetchModeration(signal?: AbortSignal): Promise<ModerationItem[]> {
  const res = await authGet<BackendPageResponse<BackendReportResponse>>("admin", "/moderation/reports?page=0&size=50", signal);
  return (res.data?.content ?? []).map(mapReport);
}

export async function resolveReport(id: number) {
  return authPatch("admin", `/moderation/reports/${id}/status`, { status: "RESOLVED" });
}

export async function dismissReport(id: number) {
  return authPatch("admin", `/moderation/reports/${id}/status`, { status: "DISMISSED" });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchStats(signal?: AbortSignal): Promise<AdminStats> {
  const res = await authGet<AdminStats>("admin", "/admin/stats", signal);
  return {
    revenue: Number(res.data.revenue ?? 0),
    activeCreators: Number(res.data.activeCreators ?? 0),
    totalUsers: Number(res.data.totalUsers ?? 0),
    pendingOrders: Number(res.data.pendingOrders ?? 0),
    totalOrders: Number(res.data.totalOrders ?? 0),
    moderationQueue: Number(res.data.moderationQueue ?? 0),
  };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<PlatformSettings> {
  const res = await authGet<PlatformSettings>("admin", "/admin/settings");
  return res.data;
}

export async function updateSettings(data: Partial<PlatformSettings>) {
  return authPatch("admin", "/admin/settings", data);
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
  status?: string,
  signal?: AbortSignal,
): Promise<AdminApplicationListItem[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await authGet<
    { content: AdminApplicationListItem[] } | AdminApplicationListItem[]
  >("admin", `/admin/applications${q}`, signal);
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data && !Array.isArray(data) && "content" in data) return data.content ?? [];
  return [];
}

export async function fetchApplication(id: string): Promise<AdminApplicationDetail> {
  const res = await authGet<AdminApplicationDetail>("admin", `/admin/applications/${id}`);
  return res.data;
}

export async function reviewApplication(id: string) {
  return authPost("admin", `/admin/applications/${id}/review`, {});
}

export async function requestApplicationInfo(id: string, message: string) {
  return authPost("admin", `/admin/applications/${id}/request-info`, { message });
}

export async function rejectApplication(id: string, reason: string) {
  return authPost("admin", `/admin/applications/${id}/reject`, { message: reason });
}

export async function confirmInstagram(id: string) {
  return authPost("admin", `/admin/applications/${id}/confirm-instagram`, {});
}

export async function messageApplication(id: string, text: string, fileUrl?: string) {
  return authPost("admin", `/admin/applications/${id}/message`, fileUrl ? { text, fileUrl } : { text });
}

export async function approveApplication(id: string) {
  return authPost("admin", `/admin/applications/${id}/approve`, {});
}

export async function deleteApplication(id: string): Promise<void> {
  await authDel("admin", `/admin/applications/${id}`);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAdminCategories(signal?: AbortSignal): Promise<AdminCategory[]> {
  const res = await authGet<AdminCategory[]>("admin", "/admin/categories", signal);
  return res.data ?? [];
}

export async function createCategory(data: AdminCategoryRequest): Promise<AdminCategory> {
  const res = await authPost<AdminCategory>("admin", "/admin/categories", data);
  return res.data;
}

export async function updateCategory(id: number, data: AdminCategoryRequest): Promise<AdminCategory> {
  const res = await authPut<AdminCategory>("admin", `/admin/categories/${id}`, data);
  return res.data;
}

export async function archiveCategory(id: number): Promise<void> {
  await authDel("admin", `/admin/categories/${id}`);
}

export async function restoreCategory(id: number): Promise<void> {
  await authPost("admin", `/admin/categories/${id}/restore`, {});
}

// ─── Occasions ─────────────────────────────────────────────────────────────────

export async function fetchOccasions(signal?: AbortSignal): Promise<AdminOccasion[]> {
  const res = await authGet<AdminOccasion[]>("admin", "/admin/occasions", signal);
  return res.data ?? [];
}

export async function createOccasion(data: AdminOccasionRequest): Promise<AdminOccasion> {
  const res = await authPost<AdminOccasion>("admin", "/admin/occasions", data);
  return res.data;
}

export async function updateOccasion(id: number, data: AdminOccasionRequest): Promise<AdminOccasion> {
  const res = await authPut<AdminOccasion>("admin", `/admin/occasions/${id}`, data);
  return res.data;
}

export async function deleteOccasion(id: number): Promise<void> {
  await authDel("admin", `/admin/occasions/${id}`);
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export async function fetchPromotions(signal?: AbortSignal): Promise<AdminPromotion[]> {
  const res = await authGet<AdminPromotion[]>("admin", "/admin/promotions", signal);
  return res.data ?? [];
}

export async function createPromotion(data: AdminPromotionRequest): Promise<AdminPromotion> {
  const res = await authPost<AdminPromotion>("admin", "/admin/promotions", data);
  return res.data;
}

export async function updatePromotion(id: number, data: AdminPromotionRequest): Promise<AdminPromotion> {
  const res = await authPut<AdminPromotion>("admin", `/admin/promotions/${id}`, data);
  return res.data;
}

export async function deletePromotion(id: number): Promise<void> {
  await authDel("admin", `/admin/promotions/${id}`);
}
