const NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN');

const COMPACT_FORMATTER = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * 格式化整數（千分位）。
 * 1,234,567 → "1,234,567"
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return NUMBER_FORMATTER.format(n);
}

/**
 * 緊湊格式（自動切到万 / 亿）。
 * 1,234,567 → "123万"；123,456,789 → "1.2亿"
 */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return COMPACT_FORMATTER.format(n);
}

/**
 * 百分比格式（保留 2 位小數）。
 * 0.1234 → "12.34%"；1 → "100.00%"
 */
export function formatPercent(n: number, fractionDigits = 2): string {
  if (!Number.isFinite(n)) return '0%';
  return `${(n * 100).toFixed(fractionDigits)}%`;
}

/**
 * 中文万 / 亿 格式（保留與舊版 `CrawlPopular.cjs` 的視覺一致性）。
 * 100,000,000 → "1亿"；12,345 → "1.2万"；999 → "999"
 */
export function formatViews(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (n >= 100_000_000) {
    const v = (n / 100_000_000).toFixed(1);
    return `${v.endsWith('.0') ? v.slice(0, -2) : v}亿`;
  }
  if (n >= 10_000) {
    const v = (n / 10_000).toFixed(1);
    return `${v.endsWith('.0') ? v.slice(0, -2) : v}万`;
  }
  return String(n);
}

/**
 * 秒數轉「時分秒」格式。
 * 3661 → "1:01:01"；125 → "2:05"；45 → "0:45"
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remain = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(remain)}`;
  }
  return `${minutes}:${pad(remain)}`;
}

/**
 * Unix 毫秒轉本地化的日期時間字串。
 */
export function formatDateTime(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
  return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * Unix 毫秒轉日期字串（不含時間）。
 */
export function formatDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

/**
 * 把位元組數轉成可讀字串（KB / MB / GB）。
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * 從 B 站視頻 URL 抽取 BV id。
 * "https://www.bilibili.com/video/BV1wEEg62EDP" → "BV1wEEg62EDP"
 */
export function extractBvid(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}
