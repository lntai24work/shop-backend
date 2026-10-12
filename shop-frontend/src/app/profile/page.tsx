"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  MapPin,
  Plus,
  Trash2,
  Edit,
  X,
  Star,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import {
  getAccessToken,
  userApi,
  addressApi,
  setStoredUser,
} from "@/lib/api";
import type { UserResponse, AddressResponse, AddressRequest } from "@/types";

const LocationPickerMap = dynamic(
  () => import("@/components/common/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-72 w-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Đang tải bản đồ định vị...</span>
      </div>
    ),
  }
);

type TabType = "profile" | "password" | "avatar" | "address";

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

  // Address states
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressError, setAddressError] = useState("");
  const [addressActionId, setAddressActionId] = useState<number | null>(null);

  // Address Modal state (Create / Edit)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [modalAddressError, setModalAddressError] = useState("");
  const [addressForm, setAddressForm] = useState<AddressRequest>({
    recipientName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detailAddress: "",
    isDefault: false,
  });

  // Delete Address state
  const [deletingAddress, setDeletingAddress] = useState<AddressResponse | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

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

  // 4. Address Book Handlers
  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      setAddressError("");
      const res = await addressApi.getAll();
      setAddresses(res.data ?? []);
    } catch (err: unknown) {
      setAddressError(
        err instanceof Error ? err.message : "Không thể tải danh sách địa chỉ"
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "address") {
      loadAddresses();
    }
  }, [activeTab, loadAddresses]);

  const handleOpenCreateAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      recipientName: user?.fullName || "",
      phone: user?.phone || "",
      province: "",
      district: "",
      ward: "",
      detailAddress: "",
      isDefault: addresses.length === 0,
    });
    setModalAddressError("");
    setShowMap(false);
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr: AddressResponse) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      detailAddress: addr.detailAddress,
      isDefault: addr.isDefault,
    });
    setModalAddressError("");
    setShowMap(false);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalAddressError("");

    // Validate phone number regex (VN phone)
    const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
    if (!phoneRegex.test(addressForm.phone.trim())) {
      setModalAddressError("Số điện thoại không đúng định dạng Việt Nam (Ví dụ: 0987654321 hoặc +84987654321)");
      return;
    }

    try {
      setAddressSubmitting(true);
      const payload: AddressRequest = {
        recipientName: addressForm.recipientName.trim(),
        phone: addressForm.phone.trim(),
        province: addressForm.province.trim(),
        district: addressForm.district.trim(),
        ward: addressForm.ward.trim(),
        detailAddress: addressForm.detailAddress.trim(),
        isDefault: addressForm.isDefault,
      };

      if (editingAddressId) {
        await addressApi.update(editingAddressId, payload);
        setAddressSuccess("Cập nhật địa chỉ thành công!");
      } else {
        await addressApi.create(payload);
        setAddressSuccess("Thêm địa chỉ mới thành công!");
      }

      setShowAddressModal(false);
      await loadAddresses();
      setTimeout(() => setAddressSuccess(""), 4000);
    } catch (err: unknown) {
      setModalAddressError(
        err instanceof Error ? err.message : "Lưu địa chỉ thất bại"
      );
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      setAddressActionId(id);
      setAddressError("");
      await addressApi.setDefault(id);
      setAddressSuccess("Đã đặt làm địa chỉ mặc định!");
      await loadAddresses();
      setTimeout(() => setAddressSuccess(""), 4000);
    } catch (err: unknown) {
      setAddressError(
        err instanceof Error ? err.message : "Không thể đặt làm địa chỉ mặc định"
      );
    } finally {
      setAddressActionId(null);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) return;
    try {
      setIsDeletingAddress(true);
      setAddressError("");
      await addressApi.delete(deletingAddress.id);
      setAddressSuccess(`Đã xóa địa chỉ của "${deletingAddress.recipientName}"`);
      setDeletingAddress(null);
      await loadAddresses();
      setTimeout(() => setAddressSuccess(""), 4000);
    } catch (err: unknown) {
      setAddressError(
        err instanceof Error ? err.message : "Xóa địa chỉ thất bại"
      );
    } finally {
      setIsDeletingAddress(false);
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

                <button
                  type="button"
                  onClick={() => setActiveTab("address")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "address"
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={18} />
                    <span>Sổ địa chỉ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {addresses.length > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                        {addresses.length}
                      </span>
                    )}
                    <ChevronRight size={16} />
                  </div>
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

              {/* TAB 4: Address Book */}
              {activeTab === "address" && (
                <div className="glass rounded-2xl p-6 sm:p-8 border border-white/8 shadow-xl animate-fade-in space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="text-primary" size={22} />
                        Sổ địa chỉ nhận hàng
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quản lý các địa chỉ giao hàng để đặt hàng nhanh chóng và thuận tiện
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCreateAddress}
                      className="btn-primary glow-primary flex items-center gap-2 px-4 py-2.5 text-xs self-start sm:self-auto"
                    >
                      <Plus size={16} />
                      <span>Thêm địa chỉ mới</span>
                    </button>
                  </div>

                  {/* Feedback Messages */}
                  {addressSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between gap-2.5 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="shrink-0" />
                        <span>{addressSuccess}</span>
                      </div>
                      <button onClick={() => setAddressSuccess("")} className="hover:opacity-75">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {addressError && (
                    <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-2.5 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{addressError}</span>
                      </div>
                      <button onClick={() => setAddressError("")} className="hover:opacity-75">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Address List */}
                  {loadingAddresses ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm">Đang tải danh sách địa chỉ...</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-14 px-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                      <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center text-white mx-auto shadow-lg glow-primary">
                        <MapPin size={22} />
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">Chưa có địa chỉ nhận hàng</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Bạn chưa lưu địa chỉ nhận hàng nào. Hãy thêm địa chỉ để tiết kiệm thời gian khi mua sắm!
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateAddress}
                        className="btn-primary glow-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 mt-2"
                      >
                        <Plus size={14} />
                        <span>Thêm địa chỉ đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`rounded-2xl p-5 border transition-all relative ${
                            addr.isDefault
                              ? "bg-white/[0.04] border-primary/40 shadow-md shadow-primary/5"
                              : "bg-white/[0.02] border-white/8 hover:border-white/15"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              {/* Header info */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-bold text-foreground text-sm">
                                  {addr.recipientName}
                                </span>
                                <span className="text-muted-foreground text-xs">|</span>
                                <span className="font-mono text-muted-foreground text-xs">
                                  {addr.phone}
                                </span>
                                {addr.isDefault && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                                    <Star size={11} className="fill-emerald-400" />
                                    <span>Mặc định</span>
                                  </span>
                                )}
                              </div>

                              {/* Detail Address */}
                              <div className="text-xs text-foreground/90 leading-relaxed">
                                <p className="font-medium">{addr.detailAddress}</p>
                                <p className="text-muted-foreground mt-0.5">
                                  {addr.ward}, {addr.district}, {addr.province}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAddress(addr)}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={14} />
                                  <span className="hidden sm:inline">Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAddress(addr)}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 text-xs inline-flex items-center gap-1 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                  <span className="hidden sm:inline">Xóa</span>
                                </button>
                              </div>

                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  disabled={addressActionId === addr.id}
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/40 text-muted-foreground hover:text-emerald-400 bg-white/5 transition-all inline-flex items-center gap-1"
                                >
                                  {addressActionId === addr.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Star size={12} />
                                  )}
                                  <span>Thiết lập mặc định</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Modal Thêm / Sửa Địa chỉ ─────────────────────────────────── */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl glass border border-white/10 p-6 space-y-4 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    {editingAddressId ? "Cập nhật địa chỉ nhận hàng" : "Thêm địa chỉ nhận hàng mới"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {modalAddressError && (
                <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalAddressError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Họ và tên người nhận <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={addressForm.recipientName}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, recipientName: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Số điện thoại <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="Ví dụ: 0987654321"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Map location picker trigger */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium inline-flex items-center justify-center gap-2 transition-all ${
                      showMap
                        ? "bg-primary/20 border-primary/50 text-primary shadow-sm"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-foreground"
                    }`}
                  >
                    <MapPin size={15} className="text-rose-400" />
                    <span>
                      {showMap
                        ? "Thu gọn bản đồ"
                        : "Ghim vị trí trên bản đồ (Tự động điền địa chỉ)"}
                    </span>
                  </button>

                  {showMap && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 animate-fade-in">
                      <LocationPickerMap
                        onLocationSelect={(geo) => {
                          setAddressForm((prev) => ({
                            ...prev,
                            province: geo.province || prev.province,
                            district: geo.district || prev.district,
                            ward: geo.ward || prev.ward,
                            detailAddress: geo.detailAddress || prev.detailAddress,
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Tỉnh / Thành phố <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Hà Nội, TP.HCM..."
                      value={addressForm.province}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, province: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Quận / Huyện <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Cầu Giấy, Q.1..."
                      value={addressForm.district}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, district: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Phường / Xã <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Dịch Vọng, Bến Nghé..."
                      value={addressForm.ward}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, ward: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-foreground">
                    Địa chỉ cụ thể (Số nhà, ngõ, tên đường) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Số 123 đường Cầu Giấy..."
                    value={addressForm.detailAddress}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, detailAddress: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, isDefault: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary bg-white/5 border-white/10"
                    />
                    <span className="text-xs text-foreground font-medium">
                      Đặt làm địa chỉ nhận hàng mặc định
                    </span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    disabled={addressSubmitting}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={addressSubmitting}
                    className="btn-primary px-5 py-2 inline-flex items-center gap-2"
                  >
                    {addressSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>{editingAddressId ? "Cập nhật" : "Lưu địa chỉ"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Xác nhận Xóa Địa chỉ ───────────────────────────────── */}
        {deletingAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl glass border border-rose-500/20 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Xóa địa chỉ nhận hàng</h3>
                  <p className="text-[11px] text-muted-foreground">Thao tác không thể hoàn tác</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Bạn có chắc chắn muốn xóa địa chỉ của:</p>
                <p className="font-bold text-foreground">
                  {deletingAddress.recipientName} ({deletingAddress.phone})
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  {deletingAddress.detailAddress}, {deletingAddress.ward}, {deletingAddress.district}, {deletingAddress.province}
                </p>
              </div>

              {deletingAddress.isDefault && addresses.length > 1 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
                  Lưu ý: Đây là địa chỉ mặc định. Hệ thống sẽ tự động chuyển địa chỉ còn lại gần nhất làm mặc định mới.
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingAddress(null)}
                  disabled={isDeletingAddress}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAddress}
                  disabled={isDeletingAddress}
                  className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-all"
                >
                  {isDeletingAddress ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <span>Xác nhận xóa</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
