/** Product imagery helpers.
 *
 * Product photos are real catalogue images vendored under /public/catalog
 * (see backend/scripts/fetch_catalog.py), so they load instantly and work
 * offline. If a file is ever missing we fall back to a category-tinted SVG. */

const CATEGORY_TINT: Record<string, [string, string]> = {
  Fashion: ["#6366f1", "#8b5cf6"],
  Footwear: ["#0ea5e9", "#2563eb"],
  Electronics: ["#0f172a", "#334155"],
  Home: ["#059669", "#0d9488"],
  Beauty: ["#db2777", "#f43f5e"],
  Sports: ["#f59e0b", "#f97316"],
};

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
