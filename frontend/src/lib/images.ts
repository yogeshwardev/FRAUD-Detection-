/** Product imagery.
 *
 * Real product photos come from the DummyJSON catalogue CDN (reliable, fast),
 * mapped from our categories. Each product deterministically picks a photo from
 * its category pool. Fallbacks (Picsum, then an inline SVG) guarantee an image
 * always renders — even offline. */

const CATEGORY_TINT: Record<string, [string, string]> = {
  Fashion: ["#6366f1", "#8b5cf6"],
  Footwear: ["#0ea5e9", "#2563eb"],
  Electronics: ["#0f172a", "#334155"],
  Home: ["#059669", "#0d9488"],
  Beauty: ["#db2777", "#f43f5e"],
  Toys: ["#f59e0b", "#f97316"],
};

// our categories -> DummyJSON catalogue categories
const CAT_MAP: Record<string, string[]> = {
  Fashion: ["mens-shirts", "womens-dresses", "tops"],
  Footwear: ["mens-shoes", "womens-shoes"],
  Electronics: ["smartphones", "laptops", "tablets", "mobile-accessories", "mens-watches"],
  Home: ["furniture", "home-decoration", "kitchen-accessories"],
  Beauty: ["beauty", "fragrances", "skin-care"],
  Toys: ["sports-accessories", "womens-jewellery", "sunglasses"],
};

let poolsPromise: Promise<Record<string, string[]>> | null = null;

function loadPools(): Promise<Record<string, string[]>> {
  if (poolsPromise) return poolsPromise;
  poolsPromise = fetch("https://dummyjson.com/products?limit=0&select=category,thumbnail")
    .then((r) => r.json())
    .then((d: { products: { category: string; thumbnail: string }[] }) => {
      const byCat: Record<string, string[]> = {};
      for (const p of d.products) (byCat[p.category] ??= []).push(p.thumbnail);
      return byCat;
    })
    .catch(() => ({}));
  return poolsPromise;
}

export async function resolveProductImage(category: string, id: number): Promise<string | null> {
  const byCat = await loadPools();
  let pool: string[] = [];
  for (const dc of CAT_MAP[category] ?? []) if (byCat[dc]) pool = pool.concat(byCat[dc]);
  if (!pool.length) return null;
  return pool[id % pool.length];
}

export function svgPlaceholder(category: string, label: string) {
  const [a, b] = CATEGORY_TINT[category] ?? ["#334155", "#0f172a"];
  const initials = label.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
    <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>
    <rect width='600' height='600' fill='url(#g)'/>
    <text x='50%' y='48%' font-family='Inter,sans-serif' font-size='150' font-weight='700'
      fill='rgba(255,255,255,0.9)' text-anchor='middle' dominant-baseline='middle'>${initials}</text>
    <text x='50%' y='62%' font-family='Inter,sans-serif' font-size='30'
      fill='rgba(255,255,255,0.75)' text-anchor='middle'>${category}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Reliable fallbacks (no network dependency on the primary source). */
export function fallbackSources(category: string, id: number, name: string, size = 600): string[] {
  return [`https://picsum.photos/seed/tl${id}/${size}/${size}`, svgPlaceholder(category, name)];
}
