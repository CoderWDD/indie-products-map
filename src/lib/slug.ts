import { createHash } from "node:crypto";

export function createSlugBase(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug.length > 0 ? slug : `project-${shortHash(name)}`;
}

export function shortHash(value: string, length = 6) {
  return createHash("sha1").update(value).digest("hex").slice(0, length);
}

export function createUniqueSlug(
  name: string,
  takenSlugs: ReadonlySet<string>,
  collisionKey = name,
) {
  const base = createSlugBase(name);
  if (!takenSlugs.has(base)) {
    return base;
  }

  const hashedSlug = `${base}-${shortHash(collisionKey)}`;
  if (!takenSlugs.has(hashedSlug)) {
    return hashedSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${hashedSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${hashedSlug}-${suffix}`;
}
