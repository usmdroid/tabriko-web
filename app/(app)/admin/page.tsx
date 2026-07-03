"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import {
  getSession,
  fetchUsers,
  blockUser,
  unblockUser,
  AdminUser,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

const STATUS_LABEL: Record<AdminUser["status"], string> = {
  active: "Faol",
  blocked: "Bloklangan",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "blocked">("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const session = getSession();

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await fetchUsers(session.token, params);
      setUsers(data);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBlock(user: AdminUser) {
    if (!session) return;
    setBusy((b) => ({ ...b, [user.id]: true }));
    try {
      if (user.status === "active") {
        await blockUser(session.token, user.id);
      } else {
        await unblockUser(session.token, user.id);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: u.status === "active" ? "blocked" : "active" }
            : u,
        ),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [user.id]: false }));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">Foydalanuvchilar</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
        >
          <option value="">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="blocked">Bloklangan</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Ism</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Holati</th>
                <th className="px-4 py-3 font-medium">Ro&apos;yxatdan o&apos;tgan</th>
                <th className="px-4 py-3 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-primary">{user.name}</td>
                    <td className="px-4 py-3 text-muted">{user.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {STATUS_LABEL[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.createdAt}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleBlock(user)}
                        disabled={busy[user.id]}
                        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                      >
                        {busy[user.id] && <Spinner size={12} />}
                        {user.status === "active" ? "Bloklash" : "Faollashtirish"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
