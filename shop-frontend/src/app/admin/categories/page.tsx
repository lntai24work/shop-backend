"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  CornerDownRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  ExternalLink,
} from "lucide-react";
import { adminCategoryApi } from "@/lib/api";
import type { CategoryResponse, CategoryRequest } from "@/types";

interface CategoryFormData {
  id?: number;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  status: "ACTIVE" | "INACTIVE";
}

const initialForm: CategoryFormData = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  imageUrl: "",
  displayOrder: 0,
  status: "ACTIVE",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Notification banners
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await adminCategoryApi.getAll();
      const list = res.data ?? [];
      setCategories(list);

      // Expand all by default
      const exp: Record<number, boolean> = {};
      list.forEach((c) => {
        if (!c.parentId) {
          exp[c.id] = true;
        }
      });
      setExpanded(exp);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build hierarchical category tree from flat list
  const categoryTree = useMemo(() => {
    const map = new Map<number, CategoryResponse & { childrenList: CategoryResponse[] }>();
    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, childrenList: [] });
    });

    const roots: (CategoryResponse & { childrenList: CategoryResponse[] })[] = [];

    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.childrenList.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  // Filter tree by search term
  const filteredTree = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categoryTree;

    return categoryTree
      .map((root) => {
        const rootMatches =
          root.name.toLowerCase().includes(q) || root.slug.toLowerCase().includes(q);
        const matchingChildren = root.childrenList.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
        );

        if (rootMatches || matchingChildren.length > 0) {
          return {
            ...root,
            childrenList: rootMatches ? root.childrenList : matchingChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as (CategoryResponse & { childrenList: CategoryResponse[] })[];
  }, [categoryTree, search]);

  const totalRoots = categoryTree.length;
  const totalChildren = categories.filter((c) => c.parentId != null).length;

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open modal for Create
  const handleOpenCreate = (parentId?: number) => {
    setFormData({
      ...initialForm,
      parentId: parentId ? String(parentId) : "",
      displayOrder: categories.length + 1,
    });
    setModalError("");
    setModalMode("create");
  };

  // Open modal for Edit
  const handleOpenEdit = (cat: CategoryResponse) => {
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ? String(cat.parentId) : "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      displayOrder: cat.displayOrder ?? 0,
      status: (cat.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    });
    setModalError("");
    setModalMode("edit");
  };

  // Handle Form Submit (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload: CategoryRequest = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        parentId: formData.parentId ? Number(formData.parentId) : null,
        displayOrder: Number(formData.displayOrder) || 0,
        status: formData.status,
      };

      if (modalMode === "create") {
        await adminCategoryApi.create(payload);
        setSuccessMsg(`Tạo danh mục "${payload.name}" thành công`);
      } else if (modalMode === "edit" && formData.id) {
        await adminCategoryApi.update(formData.id, payload);
        setSuccessMsg(`Cập nhật danh mục "${payload.name}" thành công`);
      }

      setModalMode(null);
      await loadData();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await adminCategoryApi.delete(deletingCategory.id);
      setSuccessMsg(`Đã xóa danh mục "${deletingCategory.name}"`);
      setDeletingCategory(null);
      await loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa danh mục");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: List possible parents for edit dropdown (exclude self and direct children)
  const availableParents = useMemo(() => {
    if (modalMode !== "edit" || !formData.id) {
      // For create mode, show all root categories
      return categories.filter((c) => !c.parentId);
    }
    // For edit mode, exclude current category and its children
    return categories.filter((c) => !c.parentId && c.id !== formData.id);
  }, [categories, modalMode, formData.id]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Notification Banners ───────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý danh mục</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cây phân cấp danh mục sản phẩm (
            <span className="font-semibold text-foreground">{totalRoots}</span> danh mục gốc,{" "}
            <span className="font-semibold text-foreground">{totalChildren}</span> danh mục con,{" "}
            tổng cộng <span className="font-semibold text-foreground">{categories.length}</span>)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
            title="Làm mới"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="btn-primary text-xs glow-primary px-4 py-2.5 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Thêm danh mục mới</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc slug danh mục..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Categories Hierarchical Table ─────────────────────────── */}
      <div className="rounded-2xl glass border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-white/[0.01]">
                <th className="py-3.5 px-4">Tên danh mục</th>
                <th className="py-3.5 px-4">Đường dẫn thân thiện (Slug)</th>
                <th className="py-3.5 px-4">Mô tả</th>
                <th className="py-3.5 px-4 text-center">Thứ tự</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Số danh mục con</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách danh mục...
                  </td>
                </tr>
              ) : filteredTree.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {search ? "Không tìm thấy danh mục nào phù hợp" : "Chưa có danh mục nào."}
                  </td>
                </tr>
              ) : (
                filteredTree.map((cat) => {
                  const hasChildren = cat.childrenList.length > 0;
                  const isExpanded = expanded[cat.id];

                  return (
                    <div key={cat.id} className="contents">
                      {/* Parent Category Row */}
                      <tr className="hover:bg-white/[0.03] transition-colors group">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            {hasChildren ? (
                              <button
                                onClick={() => toggleExpand(cat.id)}
                                className="p-1 rounded hover:bg-white/10 text-muted-foreground"
                                title={isExpanded ? "Thu gọn" : "Mở rộng"}
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="w-6" />
                            )}
                            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/20">
                              <Layers size={14} />
                            </div>
                            <span className="text-sm font-bold text-foreground">{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-primary">
                          /{cat.slug}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                          {cat.description || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-muted-foreground">
                          {cat.displayOrder ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              cat.status === "INACTIVE"
                                ? "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {cat.status === "INACTIVE" ? "Ẩn" : "Hoạt động"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-foreground">
                            {cat.childrenList.length} con
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenCreate(cat.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Thêm danh mục con"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                              title="Sửa danh mục"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(cat)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
                              title="Xóa danh mục"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Child Rows */}
                      {hasChildren &&
                        isExpanded &&
                        cat.childrenList.map((child) => (
                          <tr
                            key={child.id}
                            className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-2.5 px-4 pl-12 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <CornerDownRight size={14} className="text-muted-foreground/40 shrink-0" />
                                <span className="font-medium text-foreground">{child.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                              /{child.slug}
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate">
                              {child.description || "—"}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">
                              {child.displayOrder ?? 0}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  child.status === "INACTIVE"
                                    ? "bg-slate-500/10 border-slate-500/20 text-slate-400"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                {child.status === "INACTIVE" ? "Ẩn" : "Hoạt động"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center text-muted-foreground">—</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEdit(child)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                                  title="Sửa danh mục con"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => setDeletingCategory(child)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
                                  title="Xóa danh mục con"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </div>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Thêm / Sửa Danh mục ───────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree size={18} className="text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  {modalMode === "create" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
                </h2>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  Tên danh mục <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Áo sơ mi nam, Giày thể thao..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  Đường dẫn (Slug)
                </label>
                <input
                  type="text"
                  placeholder="Tự động sinh từ tên nếu để trống"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 font-mono text-[11px] text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Định dạng: chữ thường, không dấu, ngăn cách bằng dấu gạch ngang (ví dụ: ao-so-mi-nam)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1.5 text-foreground">
                    Danh mục cha
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="" className="bg-[#121218] text-foreground">
                      -- Danh mục gốc --
                    </option>
                    {availableParents.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#121218] text-foreground">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1.5 text-foreground">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="ACTIVE" className="bg-[#121218] text-emerald-400">
                    Hoạt động (Hiển thị)
                  </option>
                  <option value="INACTIVE" className="bg-[#121218] text-slate-400">
                    Ẩn (Tạm ngưng)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">
                  URL Ảnh đại diện
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/category.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả thông tin danh mục..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{modalMode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận Xóa ──────────────────────────────────────── */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass border border-rose-500/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Xóa danh mục</h3>
                <p className="text-[11px] text-muted-foreground">Thao tác xóa mềm</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <span className="font-bold text-foreground">"{deletingCategory.name}"</span>?
            </p>

            {categories.some((c) => c.parentId === deletingCategory.id) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
                Cảnh báo: Danh mục này đang chứa các danh mục con!
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-all"
              >
                {isDeleting ? (
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
    </div>
  );
}
