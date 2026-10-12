"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  X,
  CreditCard,
  MapPin,
  Calendar,
  ChevronDown,
} from "lucide-react";

interface OrderItem {
  id: number;
  productName: string;
  price: number;
  quantity: number;
}

interface MockOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "COD" | "VNPAY";
  paymentStatus: "PAID" | "PENDING";
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  createdAt: string;
}

const initialOrders: MockOrder[] = [
  {
    id: "ORD-9421",
    customerName: "Nguyễn Văn Hùng",
    phone: "0912345678",
    address: "Số 12 ngõ 45 phố Chùa Bộc, Đống Đa, Hà Nội",
    items: [
      { id: 1, productName: "Áo Thun Nam Cổ Tròn Cotton Compact Basic", price: 199000, quantity: 2 },
      { id: 2, productName: "Quần Jeans Nam Slimfit Xanh Đậm Co Giãn", price: 450000, quantity: 1 },
    ],
    total: 848000,
    paymentMethod: "VNPAY",
    paymentStatus: "PAID",
    status: "DELIVERED",
    createdAt: "2026-10-12 10:15",
  },
  {
    id: "ORD-9420",
    customerName: "Trần Thị Mai",
    phone: "0987654321",
    address: "Tòa S2.05 Vinhomes Ocean Park, Gia Lâm, Hà Nội",
    items: [
      { id: 3, productName: "Váy Đầm Nữ Dự Tiệc Dáng Xòe Lụa Sang Trọng", price: 590000, quantity: 1 },
      { id: 4, productName: "Áo Kiểu Nữ Peplum Cổ V Tôn Dáng Thanh Lịch", price: 320000, quantity: 2 },
    ],
    total: 1230000,
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    status: "SHIPPING",
    createdAt: "2026-10-12 09:30",
  },
  {
    id: "ORD-9419",
    customerName: "Lê Hoàng Long",
    phone: "0933445566",
    address: "45/2 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh",
    items: [
      { id: 5, productName: "Áo Sơ Mi Nam Oxford Trắng Dài Tay Cao Cấp", price: 350000, quantity: 1 },
    ],
    total: 350000,
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    status: "CONFIRMED",
    createdAt: "2026-10-12 08:05",
  },
  {
    id: "ORD-9418",
    customerName: "Phạm Thu Hương",
    phone: "0944556677",
    address: "128 Lê Lợi, TP. Đà Nẵng",
    items: [
      { id: 6, productName: "Váy Hoa Nhí Vintage Dáng Dài Cổ Vuông", price: 420000, quantity: 1 },
      { id: 7, productName: "Chân Váy Chữ A Cạp Cao Xẻ Tà", price: 280000, quantity: 1 },
    ],
    total: 700000,
    paymentMethod: "VNPAY",
    paymentStatus: "PAID",
    status: "PENDING",
    createdAt: "2026-10-11 21:40",
  },
  {
    id: "ORD-9417",
    customerName: "Đỗ Quốc Bảo",
    phone: "0977112233",
    address: "88 Trần Phú, TP. Nha Trang",
    items: [
      { id: 8, productName: "Áo Thun Nam Polo Thể Thao Pique", price: 299000, quantity: 1 },
    ],
    total: 299000,
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    status: "CANCELLED",
    createdAt: "2026-10-11 15:20",
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<MockOrder[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const updateOrderStatus = (orderId: string, nextStatus: MockOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: nextStatus });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search);

    const matchStatus = statusFilter === "ALL" ? true : o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: MockOrder["status"]) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Đã giao hàng
          </span>
        );
      case "SHIPPING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck size={12} /> Đang giao
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 size={12} /> Đã xác nhận
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Chờ xử lý
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tổng cộng <span className="font-semibold text-foreground">{orders.length}</span> đơn hàng ghi nhận trong hệ thống
          </p>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "PENDING", label: "Chờ xử lý" },
            { key: "CONFIRMED", label: "Đã xác nhận" },
            { key: "SHIPPING", label: "Đang giao" },
            { key: "DELIVERED", label: "Hoàn tất" },
            { key: "CANCELLED", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? "bg-primary text-white font-semibold"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders Table ───────────────────────────────────────────── */}
      <div className="rounded-2xl glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-white/[0.01]">
                <th className="py-3.5 px-4">Mã đơn</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Thanh toán</th>
                <th className="py-3.5 px-4">Tổng tiền</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{order.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">{order.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10">
                          {order.paymentMethod}
                        </span>
                        {order.paymentStatus === "PAID" ? (
                          <span className="text-[10px] text-emerald-400">Đã trả</span>
                        ) : (
                          <span className="text-[10px] text-amber-400">Chưa trả</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {formatVnd(order.total)}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{order.createdAt}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-all"
                        >
                          <Eye size={14} />
                          <span>Chi tiết</span>
                        </button>

                        {/* Quick status dropdown */}
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as MockOrder["status"])
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="PENDING" className="bg-card">Chờ xử lý</option>
                          <option value="CONFIRMED" className="bg-card">Xác nhận</option>
                          <option value="SHIPPING" className="bg-card">Đang giao</option>
                          <option value="DELIVERED" className="bg-card">Đã giao</option>
                          <option value="CANCELLED" className="bg-card">Hủy đơn</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail Modal ─────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl glass border border-white/10 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center text-white">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Chi tiết đơn hàng {selectedOrder.id}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Đặt lúc: {selectedOrder.createdAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" /> Thông tin giao hàng
                </p>
                <p className="text-foreground font-medium">{selectedOrder.customerName}</p>
                <p className="text-muted-foreground">SĐT: {selectedOrder.phone}</p>
                <p className="text-muted-foreground leading-relaxed">{selectedOrder.address}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CreditCard size={14} className="text-primary" /> Thanh toán & Trạng thái
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <span className="font-semibold text-foreground">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thanh toán:</span>
                  <span className={selectedOrder.paymentStatus === "PAID" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {selectedOrder.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span>{getStatusBadge(selectedOrder.status)}</span>
                </div>
              </div>
            </div>

            {/* Product list */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Danh sách sản phẩm trong đơn
              </h3>
              <div className="rounded-xl border border-white/5 overflow-hidden divide-y divide-border/20 text-xs">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 bg-white/[0.01]">
                    <div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatVnd(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatVnd(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="p-3.5 flex items-center justify-between bg-white/[0.03] font-bold text-sm">
                  <span>Tổng tiền thanh toán</span>
                  <span className="text-primary">{formatVnd(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Thay đổi trạng thái đơn:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, "CONFIRMED")}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all font-medium"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, "SHIPPING")}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all font-medium"
                >
                  Giao hàng
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, "DELIVERED")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium"
                >
                  Hoàn tất
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, "CANCELLED")}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-medium"
                >
                  Hủy đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
