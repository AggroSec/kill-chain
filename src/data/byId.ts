/** Turns a list of { id } entries into a lookup table keyed by id. */
export function byId<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
