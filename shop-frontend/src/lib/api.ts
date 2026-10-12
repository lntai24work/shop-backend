import type {
  ApiResponse,
  PageResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  CategoryResponse,
  ProductResponse,
  ProductFilterRequest,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
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
};

// ─── Category ─────────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => apiFetch<CategoryResponse[]>("/api/v1/categories"),
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
