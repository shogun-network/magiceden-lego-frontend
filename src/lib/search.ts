import Fuse from "fuse.js";

export function fuzzySearch<T>(
  list: T[],
  keys: (keyof T)[],
  query: string
): T[] {
  if (!query.trim()) return list; // Return all items if query is empty

  const fuse = new Fuse(list, {
    keys: keys as string[], // Define searchable keys
    includeScore: false, // Hide match scores (set to true for debugging)
    threshold: 0.2, // Adjust for stricter/looser matching
  });

  return fuse.search(query).map((result) => result.item);
}
