import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones, Zap } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { categoryApi, productApi } from "@/lib/api";

export const revalidate = 60; // ISR mỗi 60 giây

async function getData() {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      categoryApi.getAll(),
      productApi.list({ size: 8, sort: "createdAt,desc" }),
    ]);
    return {
      categories: categoriesRes.data ?? [],
      products: productsRes.data?.content ?? [],
    };
  } catch {
    return { categories: [], products: [] };
  }
}

export default async function HomePage() {
  const { categories, products } = await getData();

  const features = [
    { icon: Truck, title: "Giao hàng nhanh", desc: "Toàn quốc 2–3 ngày" },
    { icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "100% chính hãng" },
    { icon: RotateCcw, title: "Đổi trả dễ dàng", desc: "30 ngày miễn phí" },
    { icon: Headphones, title: "Hỗ trợ 24/7", desc: "Luôn sẵn sàng giúp đỡ" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-300" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs text-primary font-medium mb-6 animate-fade-up">
                <Zap size={12} />
                Mới nhất · Chất lượng nhất
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up delay-100">
                Mua sắm{" "}
                <span className="text-gradient">thông minh</span>
                <br />
                sống đẳng cấp
              </h1>

              <p className="text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed animate-fade-up delay-200">
                Khám phá hàng nghìn sản phẩm chất lượng cao với giá tốt nhất.
                Giao hàng nhanh, đổi trả dễ dàng, bảo hành chính hãng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 btn-primary text-base glow-primary"
                  id="hero-cta-shop"
                >
                  Mua ngay
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-2.5 glass rounded-lg text-base font-semibold hover:bg-white/8 transition-all"
                  id="hero-cta-explore"
                >
                  Khám phá
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-14 animate-fade-up delay-400">
                {[
                  { value: "10K+", label: "Sản phẩm" },
                  { value: "50K+", label: "Khách hàng" },
                  { value: "4.9★", label: "Đánh giá" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────── */}
        <section className="py-12 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ──────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-2">
                    Danh mục
                  </p>
                  <h2 className="text-3xl font-bold">Mua theo danh mục</h2>
                </div>
                <Link
                  href="/products"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Xem tất cả <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
                    className="group flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                    id={`category-${cat.slug}`}
                  >
                    <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📦
                    </div>
                    <p className="text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── New Products ─────────────────────────────────── */}
        <section className="py-20 bg-card/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-2">
                  Mới nhất
                </p>
                <h2 className="text-3xl font-bold">Sản phẩm mới</h2>
              </div>
              <Link
                href="/products"
                className="text-sm text-primary hover:underline flex items-center gap-1"
                id="new-products-see-all"
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Chưa có sản phẩm nào.</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Hãy thêm sản phẩm qua Admin API.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl brand-gradient p-12 text-center">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Đăng ký ngay hôm nay
                </h2>
                <p className="text-white/80 mb-8 text-lg">
                  Tạo tài khoản miễn phí và bắt đầu mua sắm thông minh.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all shadow-xl"
                  id="cta-register"
                >
                  Đăng ký miễn phí <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
