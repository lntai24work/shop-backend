"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { productApi, categoryApi } from "@/lib/api";
import type { ProductResponse, CategoryResponse } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal create product
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    originalPrice: "",
    stock: "",
    shortDescription: "",
    description: "",
  });

  const loadData = () => {
    setLoading(true);
    productApi
      .list({
        keyword: keyword || undefined,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        page,
        size: 10,
        sort: "createdAt,desc",
      })
      .then((res) => {
        setProducts(res.data?.content ?? []);
        setTotalPages(res.data?.totalPages ?? 0);
        setTotalElements(res.data?.totalElements ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [page, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tổng cộng <span className="font-semibold text-foreground">{totalElements}</span> sản phẩm trong kho
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs glow-primary px-4 py-2.5 inline-flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>

      {/* ── Filters & Search ───────────────────────────────────────── */}
      <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="" className="bg-card text-foreground">
              Tất cả danh mục
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-card text-foreground">
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL" className="bg-card text-foreground">
              Tất cả trạng thái
            </option>
            <option value="ACTIVE" className="bg-card text-foreground">
              Đang bán
            </option>
            <option value="OUT_OF_STOCK" className="bg-card text-foreground">
              Hết hàng
            </option>
          </select>
        </div>
      </div>

      {/* ── Products Table ─────────────────────────────────────────── */}
      <div className="rounded-2xl glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-white/[0.01]">
                <th className="py-3.5 px-4">Sản phẩm</th>
                <th className="py-3.5 px-4">Danh mục</th>
                <th className="py-3.5 px-4">Giá bán</th>
                <th className="py-3.5 px-4">Tồn kho</th>
                <th className="py-3.5 px-4">Đã bán</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu sản phẩm...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.stock > 0 && product.stock <= 20;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-muted-foreground">
                            <ShoppingBag size={18} />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-foreground truncate">{product.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {product.categoryName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-foreground">{formatVnd(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="block text-[10px] text-muted-foreground line-through">
                            {formatVnd(product.originalPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? "text-rose-400"
                              : isLowStock
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {product.soldCount}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Hết hàng
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Đang bán
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                            title="Xem trang bán hàng"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => alert(`Chức năng sửa sản phẩm ID: ${product.id} sẽ kết nối API PUT /admin/products/{id}`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
                                alert(`Đã xóa thành công sản phẩm ID: ${product.id}`);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-all"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Trang <span className="font-semibold text-foreground">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Thêm sản phẩm ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl glass border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Thêm sản phẩm mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Đã lưu sản phẩm thành công! (Mock modal - API backend sẵn sàng kết nối)");
                setShowCreateModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium mb-1.5 text-foreground">Tên sản phẩm *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Áo sơ mi nam lụa cao cấp..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1.5 text-foreground">Danh mục *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="" className="bg-card">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-foreground">Số lượng tồn kho *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1.5 text-foreground">Giá bán (VNĐ) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="350000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-foreground">Giá gốc (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="450000"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Mô tả tóm tắt tính năng chính của sản phẩm..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary px-5 py-2">
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
