"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchOrders,
  AdminOrder,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";

type StatusFilter = "" | "pending" | "in_progress" | "delivered" | "accepted" | "rejected" | "refunded";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "delivered", label: "Yetkazildi" },
  { value: "accepted", label: "Qabul qilindi" },
  { value: "rejected", label: "Rad etildi" },
  { value: "refunded", label: "Qaytarildi" },
];

const STATUS_BADGE: Record<AdminOrder["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  refunded: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<AdminOrder["status"], string> = {
  pending: "Kutilmoqda",
  in_progress: "Jarayonda",
  delivered: "Yetkazildi",
  accepted: "Qabul qilindi",
  rejected: "Rad etildi",
  refunded: "Qaytarildi",
};

function formatAmount(amount: number) {
  return amount.toLocaleString("uz-UZ") + " so'm";
}

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [error, setError] = useState("");

  const orders = statusFilter
    ? allOrders.filter((o) => o.status === statusFilter)
    : allOrders;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAllOrders(await fetchOrders());
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Ma'lumot mavjud emas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">Buyurtmalar</h1>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-accent text-white"
                : "border border-line text-muted hover:bg-card"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Foydalanuvchi</th>
                <th className="px-4 py-3 font-medium">Kreator</th>
                <th className="px-4 py-3 font-medium">Miqdor</th>
                <th className="px-4 py-3 font-medium">Holati</th>
                <th className="px-4 py-3 font-medium">Sana</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {order.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-primary">{order.userName}</td>
                    <td className="px-4 py-3 text-primary">{order.creatorName}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatAmount(order.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{order.createdAt}</td>
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
