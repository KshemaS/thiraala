import Link from "next/link";
import { SareeProduct } from "@/data/products";

export default function ProductBreadcrumbs({ product }: { product: SareeProduct }) {
  return (
    <nav className="text-xs font-semibold text-[#1E3A2C]/50 uppercase tracking-widest mb-8 flex flex-wrap items-center gap-2 select-none pb-6">
      <Link href="/" className="hover:text-[#DAA87C] transition-colors">
        Home
      </Link>
      <span>&gt;</span>
      <Link href="/products" className="hover:text-[#DAA87C] transition-colors">
        Products
      </Link>
      <span>&gt;</span>
      <span className="text-[#DAA87C]/80">{product.category}</span>
      <span>&gt;</span>
      <span className="text-[#1E3A2C] font-bold truncate max-w-[200px] sm:max-w-none">
        {product.name}
      </span>
    </nav>
  );
}
