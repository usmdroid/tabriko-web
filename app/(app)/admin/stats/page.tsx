"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Users, Star, ShoppingBag, Clock, Shield } from "lucide-react";
import { getSession, fetchStats, AdminStats } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";
import CountUp from "@/app/components/CountUp";

interface StatCard {
  label: string;
  key: keyof AdminStats;
  icon: React.ElementType;
  suffix?: string;
}

const CARDS: StatCard[] = [
  {
    label: "Daromad",
    key: "revenue",
    icon: TrendingUp,
    suffix: " so'm",
  },
  { label: "Faol kreatorlar", key: "activeCreators", icon: Star },
  { label: "Jami foydalanuvchilar", key: "totalUsers", icon: Users },
  { label: "Jami buyurtmalar", key: "totalOrders", icon: ShoppingBag },
  { label: "Kutilayotgan buyurtmalar", key: "pendingOrders", icon: Clock },
  { label: "Moderatsiya navbati", key: "moderationQueue", icon: Shield },
];

export default function AdminStatsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const session = getSession();

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setStats(await fetchStats(session.token));
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-primary mb-4">Statistika</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;

          return (
            <div key={card.key} className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted">{card.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Icon size={16} className="text-accent" />
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <p className="text-2xl font-bold text-primary">
                  <CountUp end={value} duration={1200} />
                  {card.suffix && (
                    <span className="text-sm font-normal text-muted ml-1">{card.suffix}</span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
