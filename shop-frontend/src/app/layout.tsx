import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ShopVN — Mua sắm thông minh",
    template: "%s | ShopVN",
  },
  description:
    "Khám phá hàng nghìn sản phẩm chất lượng với giá tốt nhất tại ShopVN.",
  keywords: ["mua sắm", "e-commerce", "sản phẩm", "online"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
