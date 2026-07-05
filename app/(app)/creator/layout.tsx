"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, Shield, LogOut, Menu, X } from "lucide-react";
import { getCreatorSession, clearCreatorSession, CreatorSession } from "@/lib/creator-api";
import { Spinner } from "@/app/components/Spinner";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/creator", label: "Profil", icon: User, exact: true },
  { href: "/creator/kyc", label: "KYC / Shaxsiy ma'lumot", icon: Shield, exact: false },
];

function SidebarContent({
  session,
  pathname,
  onLogout,
}: {
  session: CreatorSession;
  pathname: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-line">
        <span className="font-serif text-lg font-bold text-primary">
          {BRAND}
          <span className="text-accent">.</span>
        </span>
        <span className="text-xs text-muted ml-1">Kreator</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 ${
                active ? "bg-accent/10 text-accent" : "text-muted hover:bg-card hover:text-primary"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <p className="text-xs text-muted truncate">{session.name}</p>
        <p className="text-xs text-accent/70 mb-3">Kreator</p>
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

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/creator/login";

  const [session, setSession] = useState<CreatorSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setLoading(false);
      return;
    }
    const s = getCreatorSession();
    if (!s || s.role !== "CREATOR") {
      clearCreatorSession();
      router.replace("/creator/login");
      return;
    }
    setSession(s);
    setLoading(false);
  }, [isLogin, router]);

  useEffect(() => {
    const handler = () => {
      clearCreatorSession();
      router.replace("/creator/login");
    };
    window.addEventListener("creator:401", handler);
    return () => window.removeEventListener("creator:401", handler);
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearCreatorSession();
    router.replace("/creator/login");
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
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface">
        <SidebarContent session={session} pathname={pathname} onLogout={() => setShowLogout(true)} />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

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

      <div className="flex flex-1 flex-col overflow-hidden">
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {showLogout && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </div>
  );
}
