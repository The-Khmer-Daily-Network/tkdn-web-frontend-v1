/**
 * First sentence (or ~160 chars) from content_blocks for meta description when subtitle is null.
 */
export function getFirstSentenceFromContent(
  contentBlocks:
    | Array<{ paragraph?: string; subtitle?: string | null }>
    | null
    | undefined,
): string | null {
  if (!contentBlocks?.length) return null;
  const first = contentBlocks.find((b) => b.paragraph?.trim());
  const text = first?.paragraph?.trim();
  if (!text) return null;
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  if (!stripped) return null;
  const match = stripped.match(/^[^.!?]*[.!?]?/);
  const firstSentence = match ? match[0].trim() : stripped.slice(0, 160).trim();
  return firstSentence.length > 0 ? firstSentence : null;
}
