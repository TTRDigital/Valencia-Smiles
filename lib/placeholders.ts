/**
 * Placeholders look like [PLACEHOLDER: ...]. They mark content the practice
 * still has to supply; README lists them. Nothing on the old site was
 * invented to fill a gap.
 */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !!value && /\[PLACEHOLDER\b/.test(value);
}
