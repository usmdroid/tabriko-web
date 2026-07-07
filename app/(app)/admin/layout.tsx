"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Star,
  ShoppingBag,
  Shield,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Tag,
  CalendarDays,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getSession, clearSession, StaffSession } from "@/lib/admin-api";
import { Spinner } from "@/app/components/Spinner";
import { BRAND } from "@/lib/brand";

// ─── Nav definition ────────────────────────────────────────────────────────────

const NAV = [
  { href: "/admin", label: "Foydalanuvchilar", icon: Users, exact: true, superAdminOnly: false },
  { href: "/admin/creators", label: "Kreatorlar", icon: Star, exact: false, superAdminOnly: false },
  { href: "/admin/categories", label: "Kategoriyalar", icon: Tag, exact: false, superAdminOnly: false },
  { href: "/admin/occasions", label: "Sanalar", icon: CalendarDays, exact: false, superAdminOnly: false },
  { href: "/admin/applications", label: "Arizalar", icon: FileText, exact: false, superAdminOnly: false },
  { href: "/admin/orders", label: "Buyurtmalar", icon: ShoppingBag, exact: false, superAdminOnly: false },
  { href: "/admin/moderation", label: "Moderatsiya", icon: Shield, exact: false, superAdminOnly: false },
  { href: "/admin/stats", label: "Statistika", icon: BarChart2, exact: false, superAdminOnly: false },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings, exact: false, superAdminOnly: true },
];

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  session,
  pathname,
  onLogout,
}: {
  session: StaffSession;
  pathname: string;
  onLogout: () => void;
}) {
  const t = useTranslations("adminApplications");
  const filtered = NAV.filter(
    (item) => !item.superAdminOnly || session.role === "SUPERADMIN",
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-line">
        <span className="font-serif text-lg font-bold text-primary">
          {BRAND}
          <span className="text-accent">.</span>
        </span>
        <span className="text-xs text-muted ml-1">Admin</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {filtered.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-card hover:text-primary"
              }`}
            >
              <item.icon size={16} />
              {item.href === "/admin/applications" ? t("pageTitle") : item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user info + logout */}
      <div className="border-t border-line px-4 py-4">
        <p className="text-xs text-muted truncate">{session.name}</p>
        <p className="text-xs text-accent/70 mb-3">
          {session.role === "SUPERADMIN" ? "Super Admin" : "Moderator"}
        </p>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card hover:text-primary transition-colors"
        >
          <LogOut size={15} />
          Chiqish
        </button>
      </div>
    </div>
  );
}

// ─── Logout modal ─────────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="surface-card w-full max-w-xs p-6 flex flex-col gap-4"
        style={{ animation: "modalIn 200ms ease forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-primary">Tizimdan chiqmoqchimisiz?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Auth guard — skip on login page
  useEffect(() => {
    if (isLogin) {
      setLoading(false);
      return;
    }
    const s = getSession();
    if (!s || (s.role !== "SUPERADMIN" && s.role !== "MODERATOR")) {
      clearSession();
      router.replace("/admin/login");
      return;
    }
    setSession(s);
    setLoading(false);
  }, [isLogin, router]);

  // 401 listener — any page can trigger this via window event
  useEffect(() => {
    const handler = () => {
      clearSession();
      router.replace("/admin/login");
    };
    window.addEventListener("admin:401", handler);
    return () => window.removeEventListener("admin:401", handler);
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.replace("/admin/login");
  }

  if (isLogin) return <>{children}</>;

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Spinner size={24} className="text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface">
        <SidebarContent
          session={session}
          pathname={pathname}
          onLogout={() => setShowLogout(true)}
        />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-line transform transition-transform duration-250 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          session={session}
          pathname={pathname}
          onLogout={() => { setMobileOpen(false); setShowLogout(true); }}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menyuni ochish"
            className="rounded-lg p-1.5 text-muted hover:bg-card transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif font-bold text-primary">
            {BRAND}
            <span className="text-accent">.</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Menyuni yopish"
            className={`ml-auto rounded-lg p-1.5 text-muted hover:bg-card transition-colors ${mobileOpen ? "" : "hidden"}`}
          >
            <X size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Logout confirmation modal */}
      {showLogout && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </div>
  );
}
