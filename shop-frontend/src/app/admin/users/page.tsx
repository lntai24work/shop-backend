"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  X,
  CheckCircle2,
} from "lucide-react";

interface MockUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  roles: string[];
  status: "ACTIVE" | "LOCKED";
  createdAt: string;
}

const initialUsers: MockUser[] = [
  {
    id: 1,
    fullName: "Admin User",
    email: "admin@shop.com",
    phone: "0901234567",
    roles: ["ROLE_ADMIN", "ROLE_USER"],
    status: "ACTIVE",
    createdAt: "2026-09-30",
  },
  {
    id: 2,
    fullName: "Nguyễn Văn Hùng",
    email: "hung.nv@gmail.com",
    phone: "0912345678",
    roles: ["ROLE_USER"],
    status: "ACTIVE",
    createdAt: "2026-10-02",
  },
  {
    id: 3,
    fullName: "Trần Thị Mai",
    email: "mai.tran@gmail.com",
    phone: "0987654321",
    roles: ["ROLE_USER"],
    status: "ACTIVE",
    createdAt: "2026-10-05",
  },
  {
    id: 4,
    fullName: "Lê Hoàng Long",
    email: "long.lh@outlook.com",
    phone: "0933445566",
    roles: ["ROLE_USER"],
    status: "LOCKED",
    createdAt: "2026-10-08",
  },
  {
    id: 5,
    fullName: "Phạm Thu Hương",
    email: "huong.pt@gmail.com",
    phone: "0944556677",
    roles: ["ROLE_USER"],
    status: "ACTIVE",
    createdAt: "2026-10-10",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "ROLE_USER",
  });

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const next = u.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
          return { ...u, status: next };
        }
        return u;
      })
    );
  };

  const toggleAdminRole = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const hasAdmin = u.roles.includes("ROLE_ADMIN");
          const nextRoles = hasAdmin
            ? u.roles.filter((r) => r !== "ROLE_ADMIN")
            : [...u.roles, "ROLE_ADMIN"];
          return { ...u, roles: nextRoles };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole =
      roleFilter === "ALL"
        ? true
        : roleFilter === "ADMIN"
        ? u.roles.includes("ROLE_ADMIN")
        : !u.roles.includes("ROLE_ADMIN");

    const matchStatus = statusFilter === "ALL" ? true : u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tổng cộng <span className="font-semibold text-foreground">{users.length}</span> tài khoản trên hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs glow-primary px-4 py-2.5 inline-flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Thêm người dùng mới</span>
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL" className="bg-card">Tất cả vai trò</option>
            <option value="ADMIN" className="bg-card">Quản trị viên (Admin)</option>
            <option value="USER" className="bg-card">Khách hàng (User)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL" className="bg-card">Tất cả trạng thái</option>
            <option value="ACTIVE" className="bg-card">Hoạt động</option>
            <option value="LOCKED" className="bg-card">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────────── */}
      <div className="rounded-2xl glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-white/[0.01]">
                <th className="py-3.5 px-4">Người dùng</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày đăng ký</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.roles.includes("ROLE_ADMIN");
                  const isLocked = u.status === "LOCKED";

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {u.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isAdmin ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 inline-flex items-center gap-1">
                              <ShieldCheck size={12} /> Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Khách hàng
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                            <Lock size={12} /> Bị khóa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} className="hidden" /> Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {u.id !== 1 && (
                            <>
                              <button
                                onClick={() => toggleAdminRole(u.id)}
                                className={`px-2 py-1 rounded-lg border text-[11px] transition-all ${
                                  isAdmin
                                    ? "border-muted-foreground/30 text-muted-foreground hover:bg-white/5"
                                    : "border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                                }`}
                                title={isAdmin ? "Gỡ quyền Admin" : "Cấp quyền Admin"}
                              >
                                {isAdmin ? "Hạ quyền" : "Thăng Admin"}
                              </button>
                              <button
                                onClick={() => toggleStatus(u.id)}
                                className={`p-1.5 rounded-lg border text-[11px] transition-all ${
                                  isLocked
                                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                }`}
                                title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Thêm Người dùng ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Thêm người dùng mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUsers([
                  ...users,
                  {
                    id: Date.now(),
                    fullName: newUser.fullName,
                    email: newUser.email,
                    phone: newUser.phone,
                    roles: newUser.role === "ROLE_ADMIN" ? ["ROLE_ADMIN", "ROLE_USER"] : ["ROLE_USER"],
                    status: "ACTIVE",
                    createdAt: new Date().toISOString().split("T")[0],
                  },
                ]);
                setShowModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium mb-1.5 text-foreground">Họ và tên *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Hoàng Văn An"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Địa chỉ email *</label>
                <input
                  required
                  type="email"
                  placeholder="an.hoang@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0988776655"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Vai trò ban đầu</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="ROLE_USER" className="bg-card">Khách hàng thông thường</option>
                  <option value="ROLE_ADMIN" className="bg-card">Quản trị viên hệ thống (Admin)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary px-5 py-2">
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
