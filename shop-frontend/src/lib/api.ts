import type {
  ApiResponse,
  PageResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserFilterParams,
  AdminCreateUserRequest,
  CategoryResponse,
  CategoryRequest,
  ProductResponse,
  ProductFilterRequest,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Token & User helpers ────────────────────────────────────────────────────────────
export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const getStoredUser = (): UserResponse | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserResponse) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
};

export const isAdmin = (): boolean => {
  const user = getStoredUser();
  return Boolean(user?.roles?.includes("ROLE_ADMIN"));
};

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
};

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    apiFetch("/api/v1/auth/logout", { method: "POST" }),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => apiFetch<UserResponse>("/api/v1/users/me"),

  updateProfile: (body: UpdateProfileRequest) =>
    apiFetch<UserResponse>("/api/v1/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  changePassword: (body: ChangePasswordRequest) =>
    apiFetch<void>("/api/v1/users/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<UserResponse>("/api/v1/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },
};

// ─── Category ─────────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => apiFetch<CategoryResponse[]>("/api/v1/categories"),
  getBySlug: (slug: string) =>
    apiFetch<CategoryResponse>(`/api/v1/categories/${slug}`),
};

export const adminCategoryApi = {
  getAll: () => apiFetch<CategoryResponse[]>("/api/v1/admin/categories"),
  getById: (id: number) =>
    apiFetch<CategoryResponse>(`/api/v1/admin/categories/${id}`),
  create: (body: CategoryRequest) =>
    apiFetch<CategoryResponse>("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: CategoryRequest) =>
    apiFetch<CategoryResponse>(`/api/v1/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/api/v1/admin/categories/${id}`, {
      method: "DELETE",
    }),
};

// ─── Product ──────────────────────────────────────────────────────────────────
export const productApi = {
  list: (params: ProductFilterRequest = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
    return apiFetch<PageResponse<ProductResponse>>(
      `/api/v1/products?${query.toString()}`
    );
  },

  getBySlug: (slug: string) =>
    apiFetch<ProductResponse>(`/api/v1/products/${slug}`),
};

// ─── Admin Users ──────────────────────────────────────────────────────────────
export const adminUserApi = {
  list: (params: UserFilterParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== "ALL") query.set(k, String(v));
    });
    return apiFetch<PageResponse<UserResponse>>(
      `/api/v1/admin/users?${query.toString()}`
    );
  },

  getById: (id: number) => apiFetch<UserResponse>(`/api/v1/admin/users/${id}`),

  updateStatus: (id: number, status: "ACTIVE" | "BLOCKED") =>
    apiFetch<UserResponse>(`/api/v1/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateRoles: (id: number, roles: string[]) =>
    apiFetch<UserResponse>(`/api/v1/admin/users/${id}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    }),

  create: (body: AdminCreateUserRequest) =>
    apiFetch<UserResponse>("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
