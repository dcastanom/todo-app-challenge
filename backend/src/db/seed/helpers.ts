import { faker } from '@faker-js/faker/locale/es';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Weighted pick — keys are options, values are relative weights. */
export function weightedPick<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = faker.number.float({ min: 0, max: total });
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return entries[0]![0];
}

/** Index into a weight array, proportional to the weights. */
export function weightedIndex(weights: readonly number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = faker.number.float({ min: 0, max: total });
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

export function chance(probability: number): boolean {
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

/** Random int in [min, max] inclusive. */
export function intBetween([min, max]: readonly [number, number]): number {
  return faker.number.int({ min, max });
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Clamp a date to "not in the future". */
export function notFuture(date: Date): Date {
  const now = Date.now();
  return date.getTime() > now ? new Date(now) : date;
}

// ── Temporal realism (drives analytics Q4 / Q9) ──────────────────────────

/** Relative activity per calendar month (Jan..Dec) — a gentle year-long wave. */
const SEASONAL_BY_MONTH = [1.1, 1.25, 1.35, 1.0, 0.85, 0.72, 0.68, 0.8, 1.15, 1.35, 1.4, 0.95];

export function seasonalFactor(date: Date): number {
  return SEASONAL_BY_MONTH[date.getMonth()] ?? 1;
}

/** Hour-of-day weights: workday shape with mid-morning and mid-afternoon peaks. */
const HOUR_WEIGHTS = [
  1, 1, 1, 1, 1, 2, 4, 8, 16, 22, 24, 20, 14, 12, 18, 21, 17, 12, 9, 7, 6, 5, 3, 2,
];

/**
 * Replace a date's time-of-day with a realistic working-hours draw.
 * Uses UTC so analytics `EXTRACT(HOUR FROM ...)` (also UTC) sees the same
 * distribution regardless of the seeding machine's timezone.
 */
export function atWorkingHour(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(
    weightedIndex(HOUR_WEIGHTS),
    faker.number.int({ min: 0, max: 59 }),
    faker.number.int({ min: 0, max: 59 }),
    0,
  );
  return result;
}

/** Nudge weekend dates onto a nearby weekday most of the time. */
export function biasToWeekday(date: Date): Date {
  const dow = date.getUTCDay(); // 0 Sun .. 6 Sat
  if (dow === 6 && chance(0.6)) return addDays(date, chance(0.5) ? -1 : 2);
  if (dow === 0 && chance(0.6)) return addDays(date, chance(0.5) ? -2 : 1);
  return date;
}

/**
 * A creation timestamp within the history window: biased toward recent,
 * shaped by monthly seasonality (rejection sampling) and dropped onto a
 * working hour of a (usually) weekday.
 */
export function randomCreatedAt(historyDays: number): Date {
  let candidate = new Date();
  for (let attempt = 0; attempt < 6; attempt++) {
    const recencyBias = Math.pow(faker.number.float({ min: 0, max: 1 }), 1.15);
    candidate = new Date(Date.now() - recencyBias * historyDays * DAY_MS);
    if (chance(seasonalFactor(candidate) / 1.4)) break;
  }
  let shaped = biasToWeekday(atWorkingHour(candidate));
  // Re-roll rather than clamp, so shaped timestamps that land in the future
  // don't pile up on the current wall-clock hour.
  if (shaped.getTime() > Date.now()) {
    shaped = atWorkingHour(
      new Date(Date.now() - faker.number.float({ min: 0.1, max: 4 }) * DAY_MS),
    );
  }
  return shaped;
}
