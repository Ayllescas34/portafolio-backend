export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Diseño de APIs REST" -> "diseno-de-apis-rest" */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Generates a slug that does not collide with existing ones by appending a
 * numeric suffix. Explicit slugs sent by the client are not altered: a
 * duplicate there is reported as a conflict instead.
 */
export async function uniqueSlug(source: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(source) || 'item';
  let candidate = base;
  for (let suffix = 2; await exists(candidate); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
