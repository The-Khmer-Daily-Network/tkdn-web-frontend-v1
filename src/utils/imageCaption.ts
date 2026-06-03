/** Caption from stored name, or derived from image URL filename. */
export function getImageCaptionFallback(src: string): string {
  if (!src) return "";
  try {
    const cleanPath = src.split("?")[0].split("#")[0];
    const segment = cleanPath.split("/").filter(Boolean).pop() || "";
    const decoded = decodeURIComponent(segment);
    const withoutExt = decoded.replace(/\.[a-zA-Z0-9]+$/, "");
    return withoutExt.replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

export function getCaptionText(
  preferred?: string | null,
  src?: string | null,
): string {
  const explicit = (preferred || "").trim();
  if (explicit) return explicit;
  return getImageCaptionFallback((src || "").trim());
}

export function normalizeImageUrlKey(url: string): string {
  const raw = (url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "http://localhost");
    const pathname = decodeURIComponent(parsed.pathname || "");
    const basename = pathname.split("/").filter(Boolean).pop() || "";
    return basename.toLowerCase();
  } catch {
    const clean = decodeURIComponent(raw.split("?")[0].split("#")[0] || "");
    const basename = clean.split("/").filter(Boolean).pop() || clean;
    return basename.toLowerCase();
  }
}
