import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fallbackSources, resolveProductImage } from "@/lib/images";

/** Renders a product photo (real product imagery from the catalogue CDN),
 *  advancing through fallback sources on error so an image always appears. */
export function ProductImage({
  category,
  id,
  name,
  size = 600,
  className,
}: {
  category: string;
  id: number;
  name: string;
  size?: number;
  className?: string;
}) {
  const fallbacks = useMemo(() => fallbackSources(category, id, name, size), [category, id, name, size]);
  const [sources, setSources] = useState<string[]>(fallbacks);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveProductImage(category, id).then((url) => {
      if (!alive) return;
      setIdx(0);
      setLoaded(false);
      setSources(url ? [url, ...fallbacks] : fallbacks);
    });
    return () => {
      alive = false;
    };
  }, [category, id, fallbacks]);

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
      <img
        src={sources[idx]}
        alt={name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setIdx((i) => Math.min(i + 1, sources.length - 1))}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
