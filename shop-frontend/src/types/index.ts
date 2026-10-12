// ========================
// Common
// ========================
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ========================
// Auth
// ========================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  user?: UserResponse;
}

// ========================
// User
// ========================
export interface UserResponse {
  id: number;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  roles: string[];
  createdAt?: string;
}

// ========================
// Category
// ========================
export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

// ========================
// Product
// ========================
export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  status: string;
  categoryId: number;
  categoryName: string;
  images: ProductImageResponse[];
  createdAt: string;
}

export interface ProductImageResponse {
  id: number;
  url: string;
  publicId: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductFilterRequest {
  keyword?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ========================
// Address
// ========================
export interface AddressResponse {
  id: number;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}
