"use client";

import { useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import {
  getSession,
  fetchOrders,
  refundOrder,
  AdminOrder,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import { Spinner } from "@/app/components/Spinner";

type StatusFilter = "" | "pending" | "in_progress" | "done" | "refunded";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Barchasi" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "in_progress", label: "Jarayonda" },
  { value: "done", label: "Bajarildi" },
  { value: "refunded", label: "Qaytarildi" },
];

const STATUS_BADGE: Record<AdminOrder["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  refunded: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<AdminOrder["status"], string> = {
  pending: "Kutilmoqda",
  in_progress: "Jarayonda",
  done: "Bajarildi",
  refunded: "Qaytarildi",
};

function formatAmount(amount: number) {
  return amount.toLocaleString("uz-UZ") + " so'm";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const session = getSession();

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setOrders(await fetchOrders(session.token, statusFilter || undefined));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefund(order: AdminOrder) {
    if (!session) return;
    setBusy((b) => ({ ...b, [order.id]: true }));
    try {
      await refundOrder(session.token, order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "refunded" } : o)),
      );
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy((b) => ({ ...b, [order.id]: false }));
    }
  }

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
                <th className="px-4 py-3 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-line">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line last:border-0 hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-3 text-primary">{order.userName}</td>
                    <td className="px-4 py-3 text-primary">{order.creatorName}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatAmount(order.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{order.createdAt}</td>
                    <td className="px-4 py-3">
                      {order.status !== "refunded" && order.status !== "pending" && (
                        <button
                          onClick={() => handleRefund(order)}
                          disabled={busy[order.id]}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {busy[order.id] ? <Spinner size={11} /> : <RotateCcw size={11} />}
                          Qaytarish
                        </button>
                      )}
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
