"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  FolderTree,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  CornerDownRight,
} from "lucide-react";
import { categoryApi } from "@/lib/api";
import type { CategoryResponse } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
    description: "",
  });

  const loadData = () => {
    setLoading(true);
    categoryApi
      .getAll()
      .then((res) => {
        const list = res.data ?? [];
        setCategories(list);
        // expand all by default
        const exp: Record<number, boolean> = {};
        list.forEach((c) => {
          exp[c.id] = true;
        });
        setExpanded(exp);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChildCount = categories.reduce(
    (acc, cat) => acc + (cat.children?.length ?? 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý danh mục</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cây phân cấp danh mục sản phẩm (<span className="font-semibold text-foreground">{categories.length}</span> danh mục gốc,{" "}
            <span className="font-semibold text-foreground">{totalChildCount}</span> danh mục con)
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
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs glow-primary px-4 py-2.5 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Thêm danh mục mới</span>
          </button>
        </div>
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
                <th className="py-3.5 px-4">Số danh mục con</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Đang tải cây danh mục...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Chưa có danh mục nào.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const hasChildren = (cat.children?.length ?? 0) > 0;
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
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="w-6" />
                            )}
                            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white shrink-0">
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
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10">
                            {cat.children?.length ?? 0} con
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setFormData({
                                  name: "",
                                  slug: "",
                                  parentId: String(cat.id),
                                  description: "",
                                });
                                setShowModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Thêm danh mục con"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => alert(`Chỉnh sửa danh mục ID: ${cat.id}`)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Sửa"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Xóa danh mục "${cat.name}"?`)) {
                                  alert(`Đã xóa danh mục ${cat.name}`);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Child Rows */}
                      {hasChildren &&
                        isExpanded &&
                        cat.children?.map((child) => (
                          <tr
                            key={child.id}
                            className="bg-white/[0.01] hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-2.5 px-4 pl-12 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <CornerDownRight size={14} className="text-muted-foreground/50" />
                                <span className="font-medium text-foreground">{child.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                              /{child.slug}
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate">
                              {child.description || "—"}
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground">—</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => alert(`Chỉnh sửa danh mục con: ${child.name}`)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                  title="Sửa"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Xóa danh mục con "${child.name}"?`)) {
                                      alert(`Đã xóa ${child.name}`);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                                  title="Xóa"
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

      {/* ── Modal Thêm Danh mục ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-base font-bold text-foreground">Thêm danh mục mới</h2>
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
                alert("Đã lưu danh mục thành công! (Mock modal)");
                setShowModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium mb-1.5 text-foreground">Tên danh mục *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Giày dép & Túi ví..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Danh mục cha</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="" className="bg-card">Là danh mục gốc (không có cha)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1.5 text-foreground">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả thông tin danh mục..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
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
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
