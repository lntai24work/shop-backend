"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  UploadCloud,
  KeyRound,
  UserCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getAccessToken,
  userApi,
  setStoredUser,
} from "@/lib/api";
import type { UserResponse } from "@/types";

type TabType = "profile" | "password" | "avatar";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Avatar upload state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");

  // 1. Fetch user profile on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/auth/login?redirect=/profile");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoadingUser(true);
        const res = await userApi.getMe();
        setUser(res.data);
        setStoredUser(res.data);
        setProfileForm({
          fullName: res.data.fullName || "",
          phone: res.data.phone || "",
        });
      } catch (err: unknown) {
        setProfileError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin hồ sơ người dùng"
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadProfile();
  }, [router]);

  // 2. Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!profileForm.fullName.trim()) {
      setProfileError("Họ và tên không được để trống");
      return;
    }

    const trimmedPhone = profileForm.phone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setProfileError(
          "Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678 hoặc +84912345678)"
        );
        return;
      }
    }

    setProfileLoading(true);
    try {
      const res = await userApi.updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: trimmedPhone || null,
      });

      setUser(res.data);
      setStoredUser(res.data);
      setProfileSuccess("Cập nhật thông tin cá nhân thành công!");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // 3. Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!passwordForm.oldPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError("Mật khẩu mới không được trùng với mật khẩu cũ");
      return;
    }

    setPasswordLoading(true);
    try {
      await userApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // 4. Handle Avatar Selection & Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setAvatarSuccess("");

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Dung lượng file tối đa là 5MB");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Chỉ chấp nhận định dạng ảnh JPEG, PNG hoặc WEBP");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    setAvatarLoading(true);
    try {
      const res = await userApi.updateAvatar(file);
      setUser(res.data);
      setStoredUser(res.data);
      setAvatarSuccess("Cập nhật ảnh đại diện thành công!");
      setTimeout(() => setAvatarSuccess(""), 4000);
    } catch (err: unknown) {
      setAvatarError(
        err instanceof Error ? err.message : "Tải ảnh đại diện lên thất bại"
      );
      setAvatarPreview(null);
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const currentAvatarSrc =
    avatarPreview || user?.avatarUrl;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* Decorative ambient gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-70" />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">Tài khoản cá nhân</span>
        </nav>

        {loadingUser ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] gap-4">
            <Loader2 className="w-9 h-9 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin hồ sơ...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Profile Card & Tab Navigation */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <div className="glass rounded-2xl p-6 border border-white/8 relative overflow-hidden shadow-xl text-center">
                <div className="absolute top-0 left-0 right-0 h-24 brand-gradient opacity-20 -z-1" />

                {/* Avatar with Upload button */}
                <div className="relative mx-auto w-24 h-24 mt-2 mb-4 group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg glow-primary flex items-center justify-center bg-card">
                    {currentAvatarSrc ? (
                      <img
                        src={currentAvatarSrc}
                        alt={user?.fullName || "Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full brand-gradient flex items-center justify-center text-3xl font-bold text-white">
                        {(user?.fullName?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Camera overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 cursor-pointer"
                    title="Nhấp để đổi ảnh đại diện"
                  >
                    {avatarLoading ? (
                      <Loader2 size={20} className="animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera size={18} />
                        <span className="text-[10px] font-semibold">Đổi ảnh</span>
                      </>
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

                {/* User info */}
                <h2 className="text-lg font-bold text-foreground">
                  {user?.fullName || "Người dùng ShopVN"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>

                {/* Role tags */}
                <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                  {user?.roles?.map((role) => (
                    <span
                      key={role}
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        role === "ROLE_ADMIN"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-primary/15 text-primary border-primary/30"
                      }`}
                    >
                      {role === "ROLE_ADMIN" ? "Quản trị viên" : "Khách hàng"}
                    </span>
                  ))}
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Đang hoạt động
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Mã tài khoản</span>
                  <span className="font-mono text-foreground font-semibold">#{user?.id}</span>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="glass rounded-2xl p-2 border border-white/8 space-y-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "profile"
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("password")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "password"
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <KeyRound size={18} />
                    <span>Đổi mật khẩu</span>
                  </div>
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("avatar")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "avatar"
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Camera size={18} />
                    <span>Ảnh đại diện</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Column: Tab Content */}
            <div className="lg:col-span-8">
              {/* TAB 1: Profile Information */}
              {activeTab === "profile" && (
                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/8 shadow-xl animate-fade-in">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <UserCheck className="text-primary" size={22} />
                      Thông tin cá nhân
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cập nhật thông tin họ tên và số điện thoại liên hệ của bạn
                    </p>
                  </div>

                  {profileSuccess && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5 animate-fade-in">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-center gap-2.5 animate-fade-in">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    {/* Email (Readonly) */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium flex items-center justify-between">
                        <span>Địa chỉ Email</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock size={12} /> Không thể chỉnh sửa
                        </span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="input-dark w-full pl-10 opacity-70 cursor-not-allowed bg-black/40 text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email này gắn liền với tài khoản và lịch sử đặt hàng của bạn.
                      </p>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="profile-fullname" className="text-sm font-medium">
                        Họ và tên <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          id="profile-fullname"
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Ví dụ: Nguyễn Văn A"
                          required
                          maxLength={100}
                          className="input-dark w-full pl-10 text-sm"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label htmlFor="profile-phone" className="text-sm font-medium">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          id="profile-phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Ví dụ: 0912345678"
                          className="input-dark w-full pl-10 text-sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Định dạng chuẩn 10 chữ số tại Việt Nam (ví dụ: 0912345678 hoặc +84912345678).
                      </p>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="btn-primary w-full sm:w-auto px-8 py-2.5 glow-primary flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {profileLoading && <Loader2 size={16} className="animate-spin" />}
                        <span>{profileLoading ? "Đang lưu..." : "Lưu thay đổi"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: Change Password */}
              {activeTab === "password" && (
                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/8 shadow-xl animate-fade-in">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Shield className="text-primary" size={22} />
                      Đổi mật khẩu
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Để bảo vệ tài khoản, vui lòng sử dụng mật khẩu mạnh từ 6 ký tự trở lên
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5 animate-fade-in">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-center gap-2.5 animate-fade-in">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Old Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="old-password" className="text-sm font-medium">
                        Mật khẩu hiện tại <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          id="old-password"
                          type={showOldPw ? "text" : "password"}
                          value={passwordForm.oldPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              oldPassword: e.target.value,
                            }))
                          }
                          placeholder="Nhập mật khẩu hiện tại"
                          required
                          className="input-dark w-full pl-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showOldPw ? "Ẩn" : "Hiện"}
                        >
                          {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="new-password" className="text-sm font-medium">
                        Mật khẩu mới <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          id="new-password"
                          type={showNewPw ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          minLength={6}
                          className="input-dark w-full pl-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showNewPw ? "Ẩn" : "Hiện"}
                        >
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="confirm-new-password" className="text-sm font-medium">
                        Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          id="confirm-new-password"
                          type={showConfirmPw ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Nhập lại mật khẩu mới"
                          required
                          minLength={6}
                          className="input-dark w-full pl-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmPw ? "Ẩn" : "Hiện"}
                        >
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="btn-primary w-full sm:w-auto px-8 py-2.5 glow-primary flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                        <span>{passwordLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: Avatar Details */}
              {activeTab === "avatar" && (
                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/8 shadow-xl animate-fade-in">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Camera className="text-primary" size={22} />
                      Ảnh đại diện cá nhân
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ảnh đại diện hiển thị trên hồ sơ và thanh điều hướng tài khoản của bạn
                    </p>
                  </div>

                  {avatarSuccess && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5 animate-fade-in">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>{avatarSuccess}</span>
                    </div>
                  )}

                  {avatarError && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-center gap-2.5 animate-fade-in">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{avatarError}</span>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                    {/* Big Preview */}
                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-primary/40 shadow-2xl glow-primary bg-card shrink-0">
                      {currentAvatarSrc ? (
                        <img
                          src={currentAvatarSrc}
                          alt={user?.fullName || "Avatar Preview"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full brand-gradient flex items-center justify-center text-4xl font-bold text-white">
                          {(user?.fullName?.[0] || "U").toUpperCase()}
                        </div>
                      )}
                      {avatarLoading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 size={32} className="animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Upload instructions & Action */}
                    <div className="space-y-4 flex-1 text-center md:text-left">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/8 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-semibold text-foreground text-sm">Yêu cầu định dạng:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Chấp nhận các định dạng ảnh: JPEG, PNG, WEBP.</li>
                          <li>Dung lượng file tối đa: 5MB.</li>
                          <li>Khuyên dùng ảnh tỷ lệ 1:1 hình vuông để hiển thị đẹp nhất.</li>
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarLoading}
                          className="btn-primary glow-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
                        >
                          {avatarLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UploadCloud size={16} />
                          )}
                          <span>{avatarLoading ? "Đang tải lên Cloudinary..." : "Tải ảnh mới lên"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
