/**
 * Pure array utilities. No external dependencies.
 * No async functions. Return types are synchronous arrays.
 */

/**
 * Returns array with duplicate values removed, preserving insertion order.
 * @param arr - Input array
 * @returns New array with unique elements in insertion order
 */
export function unique<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const item of arr) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/**
 * Splits an array into chunks of the given size.
 * @param arr - Input array
 * @param size - Chunk size (positive integer)
 * @returns Array of chunks
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0 || arr.length === 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
