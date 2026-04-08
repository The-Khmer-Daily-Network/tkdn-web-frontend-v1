/**
 * Convert a category name to a URL-friendly slug
 * @param name - Category name to convert
 * @returns URL-friendly slug
 */
export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove special characters except hyphens
    .replace(/\-\-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "") // Remove leading hyphens
    .replace(/-+$/, ""); // Remove trailing hyphens
}

/**
 * Convert a slug back to a category name (approximate)
 * This is a helper for display purposes
 * @param slug - URL slug to convert
 * @returns Category name (approximate)
 */
export function slugToCategoryName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
