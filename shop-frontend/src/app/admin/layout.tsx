"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingCart,
  Store,
  LogOut,
  Zap,
  Menu,
  X,
  Bell,
  Search,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { getStoredUser, clearTokens, userApi, setStoredUser, getAccessToken } from "@/lib/api";
import type { UserResponse } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: "Tổng quan", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Sản phẩm", href: "/admin/products", icon: Package },
  { name: "Danh mục", href: "/admin/categories", icon: Layers },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login?redirect=/admin");
      return;
    }

    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      if (!stored.roles?.includes("ROLE_ADMIN")) {
        router.push("/");
        return;
      }
      setChecking(false);
    } else {
      userApi
        .getMe()
        .then((res) => {
          setStoredUser(res.data);
          setUser(res.data);
          if (!res.data.roles?.includes("ROLE_ADMIN")) {
            router.push("/");
          } else {
            setChecking(false);
          }
        })
        .catch(() => {
          clearTokens();
          router.push("/auth/login?redirect=/admin");
        });
    }
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push("/auth/login");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Đang xác thực quyền Quản trị viên...
        </p>
      </div>
    );
  }

  const currentNav = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  ) ?? { name: "Quản trị" };

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* ── Mobile Sidebar Overlay ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r border-border/40 bg-card/50 backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center glow-primary">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-gradient">ShopVN</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Hệ thống quản lý</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-white/5"
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-3 py-2">
            Điều hướng chính
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-white shadow-lg glow-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer profile & actions */}
        <div className="p-3 border-t border-border/40 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <Store size={16} />
            <span>Về cửa hàng ShopVN</span>
          </Link>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user?.fullName?.[0] || user?.firstName?.[0] || "A").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-foreground">
                  {user?.fullName || user?.firstName || "Quản trị viên"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/40 bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-white/5"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hover:text-foreground transition-colors">Admin</span>
              <ChevronRight size={12} />
              <span className="font-semibold text-foreground">{currentNav.name}</span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* System status pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hệ thống trực tuyến</span>
            </div>

            {/* Notifications */}
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all relative"
              aria-label="Thông báo"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
