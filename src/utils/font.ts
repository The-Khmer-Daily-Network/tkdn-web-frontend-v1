/**
 * Check if a string contains Khmer characters
 * Khmer Unicode range: U+1780–U+17FF
 * @param text - Text to check
 * @returns true if text contains Khmer characters
 */
export function containsKhmer(text: string): boolean {
  if (!text) return false;
  // Khmer Unicode range: U+1780 to U+17FF
  const khmerRegex = /[\u1780-\u17FF]/;
  return khmerRegex.test(text);
}

/**
 * Get the appropriate font family based on text content.
 * Body/caption: AKbalthom (article, image names). Headers: use font-khmer-heading or Inter Khmer Looped.
 * @param text - Text to check
 * @param defaultFont - Default font family (defaults to --font-poppins)
 * @returns Font family string (AKbalthom for Khmer body text)
 */
export function getFontFamily(
  text: string,
  defaultFont: string = "var(--font-poppins)",
): string {
  if (containsKhmer(text)) {
    return 'var(--font-khmer-body), "AKbalthom Techno", ui-sans-serif, system-ui, sans-serif';
  }
  return defaultFont;
}

/**
 * Get inline style for font family based on text content
 * @param text - Text to check
 * @param defaultFont - Default font family
 * @returns Style object with fontFamily property
 */
export function getFontStyle(
  text: string,
  defaultFont: string = "var(--font-poppins)",
): React.CSSProperties {
  const fontFamily = getFontFamily(text, defaultFont);
  return {
    fontFamily: fontFamily,
  } as React.CSSProperties;
}

/**
 * Get className for font based on text content
 * @param text - Text to check
 * @returns className string (empty if no Khmer characters)
 */
export function getFontClassName(text: string): string {
  if (containsKhmer(text)) {
    return "font-khmer";
  }
  return "";
}
