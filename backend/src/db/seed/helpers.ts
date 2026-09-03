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

/** A creation date within the history window, mildly biased toward recent. */
export function randomCreatedAt(historyDays: number): Date {
  const bias = Math.pow(faker.number.float({ min: 0, max: 1 }), 1.4);
  const offsetDays = bias * historyDays;
  return new Date(Date.now() - offsetDays * DAY_MS);
}

/** Clamp a date to "not in the future". */
export function notFuture(date: Date): Date {
  const now = Date.now();
  return date.getTime() > now ? new Date(now) : date;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
