/**
 * src/common/utils/date.ts
 *
 * Helpers for converting UTC epoch milliseconds to UTC+8 day buckets.
 * Server (Crawler / buildAggregations) and client (trend date labels) both
 * rely on UTC+8 conventions per docs/data-schema.md.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const UTC8_OFFSET_MS = 8 * MS_PER_HOUR;

/**
 * Format epoch ms as YYYY-MM-DD in UTC+8.
 *
 * Used by trend x-axis labels (line chart "date") and crawler file naming.
 */
export function dateStringUTC8(time: number): string {
  const shifted = new Date(time + UTC8_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Return the UTC+8 hour-of-day (0..23) for a Unix-seconds publish time.
 *
 * Replaces `new Date(pubdate * 1000 + 8 * 60 * 60 * 1000).getUTCHours()`
 * scattered through CrawlPopular.cjs and aggregation code.
 */
export function hourUTC8FromUnixSeconds(unixSeconds: number): number {
  const shifted = new Date(unixSeconds * 1000 + UTC8_OFFSET_MS);
  return shifted.getUTCHours();
}
