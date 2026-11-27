import { listCategories } from "@/lib/categories";
import { queryShopProducts, type UnifiedProduct } from "@/lib/products";

/** Products shown under each category tab on the home page. */
const PER_CATEGORY = 12;

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export interface HomeData {
  newArrivals: UnifiedProduct[];
  bestSellers: UnifiedProduct[];
  categories: HomeCategory[];
  /** Products per category slug. */
  categoryProducts: Record<string, UnifiedProduct[]>;
}

/**
 * Everything the home page's product sections need, loaded on the server in
 * one go (a few small queries, never photos), so the page arrives with real
 * products in its HTML instead of fetching them after it loads.
 */
export async function getHomeData(): Promise<HomeData> {
  const [newest, best, allCategories] = await Promise.all([
    queryShopProducts({ sort: "newest", limit: 6 }),
    queryShopProducts({ sort: "bestselling", limit: 4 }),
    listCategories(),
  ]);
  const categories = allCategories
    .filter((c) => c.status !== "inactive")
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, image: c.image }));
  const perCategory = await Promise.all(
    categories.map((c) => queryShopProducts({ category: c.name, limit: PER_CATEGORY }).then((r) => [c.slug, r.products] as const))
  );
  return {
    newArrivals: newest.products,
    bestSellers: best.products,
    categories,
    categoryProducts: Object.fromEntries(perCategory),
  };
}

export const EMPTY_HOME: HomeData = { newArrivals: [], bestSellers: [], categories: [], categoryProducts: {} };
