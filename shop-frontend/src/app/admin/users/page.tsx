"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { adminUserApi, getStoredUser } from "@/lib/api";
import type { UserResponse } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Notification banners
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal create user
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "ROLE_USER",
  });

  const currentUser = getStoredUser();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await adminUserApi.list({
        keyword: search.trim() || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        size: 50,
      });
      setUsers(res.data.content);
      setTotalElements(res.data.totalElements);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleToggleStatus = async (user: UserResponse) => {
    const nextStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    const actionLabel = nextStatus === "BLOCKED" ? "Khóa" : "Mở khóa";

    try {
      setActionLoadingId(user.id);
      const res = await adminUserApi.updateStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      showNotification(`${actionLabel} tài khoản ${user.email} thành công!`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : `${actionLabel} tài khoản thất bại`, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (user: UserResponse) => {
    const isAdmin = user.roles.includes("ROLE_ADMIN");
    const nextRoles = isAdmin ? ["ROLE_USER"] : ["ROLE_ADMIN", "ROLE_USER"];
    const actionLabel = isAdmin ? "Hạ quyền Admin" : "Thăng cấp Admin";

    try {
      setActionLoadingId(user.id);
      const res = await adminUserApi.updateRoles(user.id, nextRoles);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      showNotification(`${actionLabel} cho ${user.email} thành công!`);
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : `${actionLabel} thất bại`, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!newUser.password || newUser.password.length < 6) {
      setModalError("Mật khẩu ban đầu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setCreating(true);
      const res = await adminUserApi.create({
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        phone: newUser.phone.trim() || undefined,
        roles: newUser.role === "ROLE_ADMIN" ? ["ROLE_ADMIN", "ROLE_USER"] : ["ROLE_USER"],
      });

      setUsers((prev) => [res.data, ...prev]);
      setTotalElements((prev) => prev + 1);
      setShowModal(false);
      setNewUser({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "ROLE_USER",
      });
      showNotification(`Tạo người dùng ${res.data.email} thành công!`);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Tạo người dùng thất bại");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="text-primary" size={24} />
            Quản lý người dùng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tổng cộng <span className="font-semibold text-foreground">{totalElements}</span> tài khoản trên hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            title="Làm mới danh sách"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
          </button>
          <button
            onClick={() => {
              setModalError("");
              setShowModal(true);
            }}
            className="btn-primary text-xs glow-primary px-4 py-2.5 inline-flex items-center gap-2 shadow-lg"
          >
            <Plus size={16} />
            <span>Thêm người dùng mới</span>
          </button>
        </div>
      </div>

      {/* ── Notifications ─────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc SĐT..."
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
            <option value="ROLE_ADMIN" className="bg-card">Quản trị viên (Admin)</option>
            <option value="ROLE_USER" className="bg-card">Khách hàng (User)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL" className="bg-card">Tất cả trạng thái</option>
            <option value="ACTIVE" className="bg-card">Hoạt động</option>
            <option value="BLOCKED" className="bg-card">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────────── */}
      <div className="rounded-2xl glass border border-white/5 overflow-hidden shadow-xl">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.roles?.includes("ROLE_ADMIN");
                  const isBlocked = u.status === "BLOCKED";
                  const isCurrentAdmin = u.email === currentUser?.email;
                  const isLoadingAction = actionLoadingId === u.id;

                  // Format registered date
                  const registeredDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "—";

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName || "Avatar"}
                              className="w-9 h-9 rounded-full object-cover border border-primary/30 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                              {((u.fullName && u.fullName[0]) || u.email[0]).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground">
                                {u.fullName || "Chưa đặt tên"}
                              </p>
                              {isCurrentAdmin && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                                  Bạn
                                </span>
                              )}
                            </div>
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 inline-flex items-center gap-1 shadow-sm">
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
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <Lock size={12} /> Bị khóa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {registeredDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {isCurrentAdmin ? (
                            <span className="text-[11px] text-muted-foreground italic px-2">
                              Tài khoản hiện tại
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleRole(u)}
                                disabled={isLoadingAction}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all disabled:opacity-50 ${
                                  isAdmin
                                    ? "border-muted-foreground/30 text-muted-foreground hover:bg-white/5"
                                    : "border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                                }`}
                                title={isAdmin ? "Hạ quyền xuống Khách hàng" : "Thăng cấp lên Admin"}
                              >
                                {isLoadingAction ? (
                                  <Loader2 size={12} className="animate-spin inline mr-1" />
                                ) : null}
                                {isAdmin ? "Hạ quyền" : "Thăng Admin"}
                              </button>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={isLoadingAction}
                                className={`p-1.5 rounded-lg border text-[11px] transition-all disabled:opacity-50 ${
                                  isBlocked
                                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                }`}
                                title={isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              >
                                {isLoadingAction ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : isBlocked ? (
                                  <Unlock size={14} />
                                ) : (
                                  <Lock size={14} />
                                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Thêm người dùng mới
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
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
                <label className="block font-medium mb-1.5 text-foreground">
                  Địa chỉ email <span className="text-destructive">*</span>
                </label>
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
                <label className="block font-medium mb-1.5 text-foreground">
                  Mật khẩu ban đầu <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  Số điện thoại <span className="text-muted-foreground text-[10px] font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="tel"
                  placeholder="0988776655"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Vai trò</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="ROLE_USER" className="bg-card">Khách hàng thông thường</option>
                  <option value="ROLE_ADMIN" className="bg-card">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary px-5 py-2 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  <span>{creating ? "Đang tạo..." : "Tạo người dùng"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
