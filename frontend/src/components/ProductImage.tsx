import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { svgPlaceholder } from "@/lib/images";

/** Real product photo on a clean white stage (like real storefronts), with a
 *  category-tinted SVG fallback if the image is missing. */
export function ProductImage({
  src,
  category,
  name,
  className,
  fit = "contain",
  eager = false,
}: {
  src?: string | null;
  category: string;
  name: string;
  className?: string;
  fit?: "contain" | "cover";
  /** load immediately (above-the-fold images) instead of lazily */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(!src);
    setLoaded(false);
  }, [src]);

  const url = failed || !src ? svgPlaceholder(category, name) : src;
  const placeholder = failed || !src;

  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
      <img
        src={url}
        alt={name}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          placeholder || fit === "cover" ? "object-cover" : "object-contain p-3",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
