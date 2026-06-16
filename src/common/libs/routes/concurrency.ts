/**
 * src/common/libs/routes/concurrency.ts
 *
 * Tiny p-limit style concurrency cap. Avoids pulling in a dep for one
 * use case in the analytics routes.
 */

export async function pLimit<T, U>(
  items: ReadonlyArray<T>,
  limit: number,
  fn: (item: T, index: number) => Promise<U>
): Promise<U[]> {
  const results = new Array<U | undefined>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      const item = items[i];
      if (item === undefined) return;
      results[i] = await fn(item, i);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    () => worker()
  );
  await Promise.all(workers);
  return results as U[];
}
