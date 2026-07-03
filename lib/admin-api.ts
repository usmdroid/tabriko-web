import { get, post, patch, ApiError } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaffRole = "SUPERADMIN" | "MODERATOR";

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
  phone: string;
  category: string;
  verified: boolean;
  flag?: "top" | "exclusive";
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  creatorId: string;
  creatorName: string;
  status: "pending" | "in_progress" | "done" | "refunded";
  amount: number;
  createdAt: string;
}

export interface ModerationItem {
  id: string;
  creatorName: string;
  type: "greeting";
  reason: string;
  status: "flagged" | "under_review";
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

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: "u1", name: "Alisher Umarov", phone: "+998901234567", status: "active", createdAt: "2024-01-10" },
  { id: "u2", name: "Mohira Karimova", phone: "+998917654321", status: "blocked", createdAt: "2024-02-05" },
  { id: "u3", name: "Jasur Toshmatov", phone: "+998931112233", status: "active", createdAt: "2024-03-20" },
  { id: "u4", name: "Dilnoza Yusupova", phone: "+998945556677", status: "active", createdAt: "2024-04-01" },
];

const MOCK_CREATORS: AdminCreator[] = [
  { id: "c1", name: "Sherzod Umarov", phone: "+998901111111", category: "Bloger", verified: true, flag: "top", createdAt: "2024-01-01" },
  { id: "c2", name: "Nilufar Rahimova", phone: "+998902222222", category: "Qo'shiqchi", verified: true, flag: "exclusive", createdAt: "2024-02-15" },
  { id: "c3", name: "Bobur Xolmatov", phone: "+998903333333", category: "Sportchi", verified: false, createdAt: "2024-05-10" },
];

const MOCK_ORDERS: AdminOrder[] = [
  { id: "o1", userId: "u1", userName: "Alisher Umarov", creatorId: "c1", creatorName: "Sherzod Umarov", status: "pending", amount: 150000, createdAt: "2024-07-01" },
  { id: "o2", userId: "u2", userName: "Mohira Karimova", creatorId: "c2", creatorName: "Nilufar Rahimova", status: "done", amount: 200000, createdAt: "2024-06-28" },
  { id: "o3", userId: "u3", userName: "Jasur Toshmatov", creatorId: "c1", creatorName: "Sherzod Umarov", status: "in_progress", amount: 150000, createdAt: "2024-07-02" },
  { id: "o4", userId: "u4", userName: "Dilnoza Yusupova", creatorId: "c3", creatorName: "Bobur Xolmatov", status: "refunded", amount: 100000, createdAt: "2024-06-20" },
];

const MOCK_MODERATION: ModerationItem[] = [
  { id: "m1", creatorName: "Sherzod Umarov", type: "greeting", reason: "Noto'g'ri kontent", status: "flagged", createdAt: "2024-07-02" },
  { id: "m2", creatorName: "Bobur Xolmatov", type: "greeting", reason: "Shikoyat qilingan", status: "under_review", createdAt: "2024-07-01" },
];

const MOCK_STATS: AdminStats = {
  revenue: 12500000,
  activeCreators: 42,
  totalUsers: 1287,
  pendingOrders: 8,
  totalOrders: 534,
  moderationQueue: 3,
};

const MOCK_SETTINGS: PlatformSettings = {
  ordersOpen: true,
  maintenanceMode: false,
  registrationOpen: true,
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function staffLogin(phone: string, password: string): Promise<StaffSession> {
  try {
    const res = await post<StaffSession>("/staff/auth/login", { phone, password });
    return res.data;
  } catch (e) {
    // Backend not available → allow mock credentials for development
    if (e instanceof ApiError && e.httpStatus === 0) {
      if (phone === "admin" && password === "admin123") {
        return { token: "mock-token-superadmin", role: "SUPERADMIN", name: "Super Admin" };
      }
      if (phone === "mod" && password === "mod123") {
        return { token: "mock-token-moderator", role: "MODERATOR", name: "Moderator" };
      }
    }
    throw e;
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(
  token: string,
  params?: { search?: string; status?: string },
): Promise<AdminUser[]> {
  try {
    const q = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
    const res = await get<AdminUser[]>(`/staff/users${q ? `?${q}` : ""}`, token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return MOCK_USERS;
  }
}

export async function blockUser(token: string, id: string) {
  return post(`/staff/users/${id}/block`, {}, token);
}

export async function unblockUser(token: string, id: string) {
  return post(`/staff/users/${id}/unblock`, {}, token);
}

// ─── Creators ────────────────────────────────────────────────────────────────

export async function fetchCreators(token: string): Promise<AdminCreator[]> {
  try {
    const res = await get<AdminCreator[]>("/staff/creators", token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return MOCK_CREATORS;
  }
}

export async function addCreator(
  token: string,
  data: { name: string; phone: string; category: string },
) {
  return post("/staff/creators", data, token);
}

export async function verifyCreator(token: string, id: string) {
  return post(`/staff/creators/${id}/verify`, {}, token);
}

export async function flagCreator(token: string, id: string, flag: "top" | "exclusive") {
  return post(`/staff/creators/${id}/flag`, { flag }, token);
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchOrders(token: string, status?: string): Promise<AdminOrder[]> {
  try {
    const q = status ? `?status=${status}` : "";
    const res = await get<AdminOrder[]>(`/staff/orders${q}`, token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return status ? MOCK_ORDERS.filter((o) => o.status === status) : MOCK_ORDERS;
  }
}

export async function refundOrder(token: string, id: string) {
  return post(`/staff/orders/${id}/refund`, {}, token);
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function fetchModeration(token: string): Promise<ModerationItem[]> {
  try {
    const res = await get<ModerationItem[]>("/staff/moderation", token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return MOCK_MODERATION;
  }
}

export async function approveModeration(token: string, id: string) {
  return post(`/staff/moderation/${id}/approve`, {}, token);
}

export async function hideModeration(token: string, id: string) {
  return post(`/staff/moderation/${id}/hide`, {}, token);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchStats(token: string): Promise<AdminStats> {
  try {
    const res = await get<AdminStats>("/staff/stats", token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return { ...MOCK_STATS };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(token: string): Promise<PlatformSettings> {
  try {
    const res = await get<PlatformSettings>("/staff/settings", token);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) rethrow401(e);
    return { ...MOCK_SETTINGS };
  }
}

export async function updateSettings(token: string, data: Partial<PlatformSettings>) {
  return patch("/staff/settings", data, token);
}
