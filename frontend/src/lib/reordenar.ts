/**
 * Returns a new array with the item at `from` moved to `to`. Out-of-range
 * indices are clamped; a no-op move returns the original array reference.
 */
export function moverItem<T>(list: readonly T[], from: number, to: number): T[] {
  const last = list.length - 1;
  const src = Math.max(0, Math.min(last, from));
  const dest = Math.max(0, Math.min(last, to));
  if (src === dest || list.length === 0) return list as T[];

  const next = [...list];
  const [moved] = next.splice(src, 1);
  next.splice(dest, 0, moved as T);
  return next;
}
