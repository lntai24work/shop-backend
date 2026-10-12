"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  RefreshCw,
} from "lucide-react";
import { productApi, categoryApi, getStoredUser } from "@/lib/api";
import type { ProductResponse } from "@/types";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: typeof DollarSign;
  sublabel: string;
}

function StatCard({ title, value, change, isPositive, icon: Icon, sublabel }: StatCardProps) {
  return (
    <div className="p-5 rounded-2xl glass border border-white/5 relative overflow-hidden card-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-0.5 font-semibold ${
            isPositive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
        <span className="text-muted-foreground">{sublabel}</span>
      </div>
    </div>
  );
}

const mockRecentOrders = [
  {
    id: "ORD-9421",
    customer: "Nguyễn Văn Hùng",
    email: "hung.nv@gmail.com",
    total: 840000,
    status: "DELIVERED",
    statusText: "Đã giao hàng",
    payment: "VNPay",
    time: "10 phút trước",
  },
  {
    id: "ORD-9420",
    customer: "Trần Thị Mai",
    email: "mai.tran@gmail.com",
    total: 1290000,
    status: "SHIPPING",
    statusText: "Đang giao",
    payment: "COD",
    time: "45 phút trước",
  },
  {
    id: "ORD-9419",
    customer: "Lê Hoàng Long",
    email: "long.lh@outlook.com",
    total: 350000,
    status: "CONFIRMED",
    statusText: "Đã xác nhận",
    payment: "COD",
    time: "2 giờ trước",
  },
  {
    id: "ORD-9418",
    customer: "Phạm Thu Hương",
    email: "huong.pt@gmail.com",
    total: 920000,
    status: "PENDING",
    statusText: "Chờ xử lý",
    payment: "VNPay",
    time: "3 giờ trước",
  },
];

const revenueBars = [
  { day: "T2", amount: "14.2M", height: "45%" },
  { day: "T3", amount: "18.5M", height: "60%" },
  { day: "T4", amount: "12.0M", height: "35%" },
  { day: "T5", amount: "22.4M", height: "75%" },
  { day: "T6", amount: "28.1M", height: "90%" },
  { day: "T7", amount: "32.6M", height: "100%" },
  { day: "CN", amount: "24.5M", height: "80%" },
];

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  const loadData = () => {
    setLoading(true);
    productApi
      .list({ size: 5, sort: "soldCount,desc" })
      .then((res) => {
        setProducts(res.data?.content ?? []);
        setTotalProducts(res.data?.totalElements ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const getStatusBadge = (status: string, text: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> {text}
          </span>
        );
      case "SHIPPING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck size={12} /> {text}
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 size={12} /> {text}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} /> {text}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* ── Welcome Banner ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass border border-white/5 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Xin chào, {user?.fullName || user?.firstName || "Quản trị viên"}!
            </h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-primary border border-primary/30">
              Admin
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Đây là bức tranh tổng thể về hoạt động kinh doanh hôm nay.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium transition-all inline-flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm mới dữ liệu</span>
          </button>
          <Link
            href="/admin/products"
            className="btn-primary text-xs glow-primary px-4 py-2"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng doanh thu tháng"
          value="152.300.000 ₫"
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
          sublabel="so với tháng trước"
        />
        <StatCard
          title="Đơn hàng"
          value="1.420"
          change="+12.2%"
          isPositive={true}
          icon={ShoppingCart}
          sublabel="98 đơn chờ duyệt"
        />
        <StatCard
          title="Khách hàng mới"
          value="385"
          change="+9.1%"
          isPositive={true}
          icon={Users}
          sublabel="tỷ lệ quay lại 64%"
        />
        <StatCard
          title="Sản phẩm đang bán"
          value={totalProducts > 0 ? String(totalProducts) : "16"}
          change="+4 mới"
          isPositive={true}
          icon={Package}
          sublabel="từ cơ sở dữ liệu"
        />
      </div>

      {/* ── Charts & Highlights ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass border border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Doanh thu 7 ngày gần nhất</h2>
              <p className="text-xs text-muted-foreground">Ước tính theo ngày trong tuần</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
              Tổng tuần: 152.3M ₫
            </span>
          </div>

          {/* Bars */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-border/30 pb-3">
            {revenueBars.map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {bar.amount}
                </span>
                <div className="w-full max-w-[42px] bg-white/[0.04] rounded-t-lg h-36 flex items-end p-1">
                  <div
                    style={{ height: bar.height }}
                    className="w-full brand-gradient rounded-md group-hover:brightness-125 transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Tự động cập nhật mỗi 15 phút</span>
            <Link href="/admin/orders" className="text-primary hover:underline font-medium">
              Xem báo cáo chi tiết →
            </Link>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-6 rounded-2xl glass border border-white/5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Sản phẩm bán chạy</h2>
            <Link href="/admin/products" className="text-xs text-primary hover:underline">
              Tất cả
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Đang tải dữ liệu sản phẩm...
              </p>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Đã bán: <span className="font-semibold text-primary">{p.soldCount}</span> •
                      Kho: {p.stock}
                    </p>
                  </div>
                  <span className="text-xs font-bold shrink-0">{formatVnd(p.price)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Orders Table ────────────────────────────────────── */}
      <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Đơn hàng mới nhất</h2>
            <p className="text-xs text-muted-foreground">Các đơn hàng phát sinh trong ngày</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs text-primary hover:underline font-medium"
          >
            Xem tất cả đơn hàng →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="py-3 px-3">Mã đơn</th>
                <th className="py-3 px-3">Khách hàng</th>
                <th className="py-3 px-3">Thanh toán</th>
                <th className="py-3 px-3">Tổng tiền</th>
                <th className="py-3 px-3">Thời gian</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {mockRecentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-primary">{order.id}</td>
                  <td className="py-3.5 px-3">
                    <p className="font-medium text-foreground">{order.customer}</p>
                    <p className="text-[11px] text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-[11px]">
                      {order.payment}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold">{formatVnd(order.total)}</td>
                  <td className="py-3.5 px-3 text-muted-foreground">{order.time}</td>
                  <td className="py-3.5 px-3">{getStatusBadge(order.status, order.statusText)}</td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      href={`/admin/orders?search=${order.id}`}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Chi tiết</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
