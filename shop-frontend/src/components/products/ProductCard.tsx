"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, ShoppingBag } from "lucide-react";
import type { ProductResponse } from "@/types";

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(product.price);

  const isOutOfStock = product.stock === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden card-hover">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                <ShoppingBag size={24} />
              </div>
              <span className="text-[11px] text-muted-foreground/60 mt-3 font-medium line-clamp-1">
                {product.categoryName}
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: add to cart
              }}
              className="flex items-center gap-2 btn-primary text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 glow-primary"
              aria-label={`Thêm ${product.name} vào giỏ`}
            >
              <ShoppingCart size={16} />
              Thêm vào giỏ
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock && (
              <span className="px-2 py-0.5 text-xs font-medium bg-destructive/90 text-white rounded-md backdrop-blur-sm">
                Hết hàng
              </span>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/90 text-black rounded-md backdrop-blur-sm">
                Còn {product.stock}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <p className="text-xs text-primary font-medium uppercase tracking-wide truncate">
            {product.categoryName}
          </p>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Stars placeholder */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < 4 ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-base font-bold text-primary">{formattedPrice}</p>
            {isOutOfStock && (
              <span className="text-xs text-muted-foreground">Hết hàng</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
