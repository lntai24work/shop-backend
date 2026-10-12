"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, User, Search, Menu, X, Zap } from "lucide-react";
import { getAccessToken, clearTokens, userApi } from "@/lib/api";
import type { UserResponse } from "@/types";

export default function Header() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      userApi.getMe().then((res) => setUser(res.data)).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/products", label: "Sản phẩm" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/5 shadow-xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">ShopVN</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Link
              href="/products"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              aria-label="Tìm kiếm"
            >
              <Search size={18} />
            </Link>

            {/* Cart placeholder */}
            <button
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 brand-gradient rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user.firstName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-sm text-foreground hidden sm:block">
                    {user.firstName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-sm glow-primary"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-white/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-4 flex flex-col gap-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
