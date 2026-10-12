import Link from "next/link";
import { Zap, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">ShopVN</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mua sắm thông minh, trải nghiệm đẳng cấp. Hàng nghìn sản phẩm
              chất lượng với giá tốt nhất.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="mailto:contact@shopvn.com"
                className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Danh mục
            </h4>
            <ul className="space-y-2">
              {["Trang chủ", "Sản phẩm", "Giỏ hàng", "Đơn hàng"].map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Hỗ trợ
            </h4>
            <ul className="space-y-2">
              {[
                "Chính sách đổi trả",
                "Chính sách vận chuyển",
                "Câu hỏi thường gặp",
                "Liên hệ",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © 2026 ShopVN. Dự án CV — Full-stack E-commerce.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with{" "}
            <span className="text-primary">Next.js 15</span> &{" "}
            <span className="text-primary">Spring Boot 4</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
