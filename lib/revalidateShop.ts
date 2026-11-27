import { revalidatePath } from "next/cache";

/**
 * After the dashboard changes products, categories or collections, mark the
 * cached home page (and sitemap) stale so the next visitor sees the change
 * straight away instead of waiting for the regular refresh.
 */
export function revalidateShop() {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

/** Wraps a route handler: on a successful response, refresh the cached shop pages. */
export function refreshesShop<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    const res = await handler(...args);
    if (res.ok) revalidateShop();
    return res;
  };
}
