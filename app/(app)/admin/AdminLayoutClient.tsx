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
  Megaphone,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getSession, clearSession, StaffSession } from "@/lib/admin-api";
import { Spinner } from "@/app/components/Spinner";
import { Modal } from "@/app/components/Modal";
import { BRAND } from "@/lib/brand";

// ─── Nav definition ────────────────────────────────────────────────────────────

const NAV = [
  // `/admin` is the users list, but user detail pages live at /admin/users/*, so
  // this entry also owns that subtree (see isNavActive).
  { href: "/admin", key: "users", icon: Users, exact: true, superAdminOnly: false },
  { href: "/admin/creators", key: "creators", icon: Star, exact: false, superAdminOnly: false },
  { href: "/admin/categories", key: "categories", icon: Tag, exact: false, superAdminOnly: false },
  { href: "/admin/occasions", key: "occasions", icon: CalendarDays, exact: false, superAdminOnly: false },
  { href: "/admin/promotions", key: "promotions", icon: Megaphone, exact: false, superAdminOnly: false },
  { href: "/admin/applications", key: "applications", icon: FileText, exact: false, superAdminOnly: false },
  { href: "/admin/orders", key: "orders", icon: ShoppingBag, exact: false, superAdminOnly: false },
  { href: "/admin/moderation", key: "moderation", icon: Shield, exact: false, superAdminOnly: false },
  { href: "/admin/stats", key: "stats", icon: BarChart2, exact: false, superAdminOnly: false },
  { href: "/admin/settings", key: "settings", icon: Settings, exact: false, superAdminOnly: true },
];

/** Whether a nav item should be highlighted for the current pathname. */
function isNavActive(item: (typeof NAV)[number], pathname: string): boolean {
  // The users list ("/admin") also owns the user detail subtree ("/admin/users/*").
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/users");
  }
  // Match the section root and any sub-route, but not a sibling that merely
  // shares a prefix (e.g. don't let "/admin/order" light up "/admin/orders").
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

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
  const t = useTranslations("admin");
  const tApp = useTranslations("adminApplications");
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
        <span className="text-xs text-muted ml-1">{t("brandSuffix")}</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {filtered.map((item) => {
          const active = isNavActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                active
                  ? "bg-accent/15 text-accent ring-1 ring-inset ring-accent/30 shadow-[0_0_12px_-2px] shadow-accent/40 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-accent"
                  : "text-muted hover:bg-card hover:text-primary"
              }`}
            >
              <item.icon size={16} />
              {item.href === "/admin/applications" ? tApp("pageTitle") : t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user info + logout */}
      <div className="border-t border-line px-4 py-4">
        <p className="text-xs text-muted truncate">{session.name}</p>
        <p className="text-xs text-accent/70 mb-3">
          {session.role === "SUPERADMIN" ? t("roleSuperadmin") : t("roleModerator")}
        </p>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card hover:text-primary transition-colors"
        >
          <LogOut size={15} />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}

// ─── Logout modal ─────────────────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations("admin");
  return (
    <Modal onClose={onCancel} labelledBy="logout-modal-title" className="surface-card w-full max-w-xs p-6 flex flex-col gap-4">
      <p id="logout-modal-title" className="text-sm font-medium text-primary">
        {t("logoutConfirm")}
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-card transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
        >
          {t("logout")}
        </button>
      </div>
    </Modal>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  const t = useTranslations("admin");
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
      clearSession().finally(() => router.replace("/admin/login"));
      return;
    }
    setSession(s);
    setLoading(false);
  }, [isLogin, router]);

  // 401 listener — any page can trigger this via window event
  useEffect(() => {
    const handler = () => {
      clearSession().finally(() => router.replace("/admin/login"));
    };
    window.addEventListener("admin:401", handler);
    return () => window.removeEventListener("admin:401", handler);
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await clearSession();
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
        id="admin-mobile-drawer"
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
            aria-label={t("openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
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
            aria-label={t("closeMenu")}
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
