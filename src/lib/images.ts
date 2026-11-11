export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  cameras: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
  tools: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  electronics: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  home: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80",
  vehicles: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
  music: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80",
  gaming: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
  events: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
  travel: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
  fashion: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
  other: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
};

export const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80";

export function isInvalidHost(url: string): boolean {
  if (!url) return true;
  return (
    /\.(biz|co\.uk|org\.uk|us|in|com\.au)\/?$/i.test(url) &&
    !url.includes("unsplash.com") &&
    !url.includes("cloudinary.com")
  );
}

export function getItemImage(
  item?: { name?: string; category?: string; images?: string[] } | null
): string {
  if (!item) return DEFAULT_FALLBACK_IMAGE;

  if (Array.isArray(item.images)) {
    const valid = item.images.find(
      (img) => img && typeof img === "string" && img.trim().startsWith("http") && !isInvalidHost(img.trim())
    );
    if (valid) return valid.trim();
  }

  const cat = (item.category || "").toLowerCase().trim();
  for (const [key, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (cat.includes(key) || key.includes(cat)) {
      return url;
    }
  }

  const name = (item.name || "").toLowerCase();
  if (name.includes("camera") || name.includes("dslr") || name.includes("tripod"))
    return CATEGORY_FALLBACK_IMAGES.cameras;
  if (name.includes("drill") || name.includes("tool") || name.includes("saw"))
    return CATEGORY_FALLBACK_IMAGES.tools;
  if (name.includes("bike") || name.includes("cycle"))
    return CATEGORY_FALLBACK_IMAGES.vehicles;
  if (name.includes("speaker") || name.includes("audio") || name.includes("sound"))
    return CATEGORY_FALLBACK_IMAGES.events;
  if (name.includes("guitar") || name.includes("piano") || name.includes("music"))
    return CATEGORY_FALLBACK_IMAGES.music;
  if (name.includes("playstation") || name.includes("xbox") || name.includes("game"))
    return CATEGORY_FALLBACK_IMAGES.gaming;
  if (name.includes("tent") || name.includes("camp"))
    return CATEGORY_FALLBACK_IMAGES.travel;
  if (name.includes("mower") || name.includes("lawn"))
    return CATEGORY_FALLBACK_IMAGES.home;
  if (name.includes("football") || name.includes("sport") || name.includes("trampoline"))
    return CATEGORY_FALLBACK_IMAGES.sports;

  return DEFAULT_FALLBACK_IMAGE;
}
