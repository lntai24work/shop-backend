"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { categoryApi, productApi } from "@/lib/api";
import type { CategoryResponse, ProductResponse } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state derived from URL
  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const page = Number(searchParams.get("page") ?? "0");

  // Local input state
  const [keywordInput, setKeywordInput] = useState(keyword);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      params.delete("page"); // reset page on filter change
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi
      .list({
        keyword: keyword || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page,
        size: 12,
        sort: "createdAt,desc",
      })
      .then((r) => {
        setProducts(r.data?.content ?? []);
        setTotalPages(r.data?.totalPages ?? 0);
        setTotalElements(r.data?.totalElements ?? 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [keyword, categoryId, minPrice, maxPrice, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ keyword: keywordInput });
  };

  const clearFilters = () => {
    setKeywordInput("");
    router.push("/products");
  };

  const hasFilters = keyword || categoryId || minPrice || maxPrice;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="bg-card/30 border-b border-border/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Tất cả sản phẩm</h1>
            <p className="text-muted-foreground text-sm">
              {totalElements > 0 ? `${totalElements} sản phẩm` : "Đang tải..."}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* ── Sidebar filter ──────────────────────────── */}
            <aside
              className={`shrink-0 w-64 space-y-6 ${
                filterOpen ? "block" : "hidden"
              } lg:block`}
            >
              <div className="glass rounded-xl p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Bộ lọc</h3>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <X size={12} /> Xóa lọc
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Danh mục
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => updateParams({ categoryId: "" })}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                        !categoryId
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateParams({ categoryId: String(cat.id) })}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                          categoryId === String(cat.id)
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                        id={`filter-category-${cat.slug}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Giá (VNĐ)
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Tối thiểu"
                      className="input-dark w-full text-sm"
                      defaultValue={minPrice}
                      onBlur={(e) => updateParams({ minPrice: e.target.value })}
                      id="filter-min-price"
                    />
                    <input
                      type="number"
                      placeholder="Tối đa"
                      className="input-dark w-full text-sm"
                      defaultValue={maxPrice}
                      onBlur={(e) => updateParams({ maxPrice: e.target.value })}
                      id="filter-max-price"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main content ────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Search + Filter toggle */}
              <div className="flex gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="input-dark w-full pl-9 text-sm"
                    id="search-keyword"
                  />
                </form>
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 glass rounded-lg text-sm hover:bg-white/5 transition-all"
                  id="toggle-filter"
                >
                  <SlidersHorizontal size={16} />
                  Lọc
                </button>
              </div>

              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {keyword && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/15 text-primary text-xs rounded-full">
                      Tìm: &quot;{keyword}&quot;
                      <button onClick={() => { setKeywordInput(""); updateParams({ keyword: "" }); }}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {categoryId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/15 text-primary text-xs rounded-full">
                      {categories.find((c) => String(c.id) === categoryId)?.name}
                      <button onClick={() => updateParams({ categoryId: "" })}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-square bg-muted" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 space-y-3">
                  <div className="text-6xl">😕</div>
                  <p className="text-lg font-semibold">Không tìm thấy sản phẩm</p>
                  <p className="text-muted-foreground text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  <button onClick={clearFilters} className="btn-primary mt-4 text-sm">
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 animate-fade-in">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    disabled={page === 0}
                    onClick={() =>
                      router.push(
                        `/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) }).toString()}`
                      )
                    }
                    className="p-2 rounded-lg border border-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          router.push(
                            `/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) }).toString()}`
                          )
                        }
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === pageNum
                            ? "brand-gradient text-white glow-primary"
                            : "border border-border hover:bg-white/5"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}

                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      router.push(
                        `/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) }).toString()}`
                      )
                    }
                    className="p-2 rounded-lg border border-border hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
