/**
 * Minimal RFC-4180 CSV serialiser. No streaming — the export endpoint is
 * row-capped (`EXPORT_MAX_ROWS`), so building the whole string is fine.
 */

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

/** Quote a field when it contains a comma, quote, CR or LF; escape quotes. */
export function csvField(value: unknown): string {
  const s = stringify(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

/** Rows → CSV text with a header line and `\r\n` terminators. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvField(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvField(c.value(row))).join(','));
  }
  return lines.join('\r\n');
}
