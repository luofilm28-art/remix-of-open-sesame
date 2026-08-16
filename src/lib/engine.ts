/**
 * Deterministic round engine.
 *
 * Nothing about the live game is stored anywhere: every client derives the
 * exact same round schedule from the UTC wall clock. That means
 *   - all players are always on the same round, in real time
 *   - a player who goes offline / closes the tab / comes back later instantly
 *     resyncs to the round everyone else is on
 *   - Firestore stays completely clean (admin config only)
 *
 * Schedule anchoring: rounds restart at the top of every UTC hour, so the
 * number of rounds to derive is always small and identical for everyone.
 */
import { BETTING_SECONDS, flightDuration, multiplierAt, type Phase } from "./game";

export const AFTER_CRASH_SECONDS = 4;
/** Hard cap: a flight can never run longer than this. Keeps a round bounded. */
export const MAX_FLIGHT_SECONDS = 45;
/** Highest reachable multiplier, derived from the flight cap. */
export const MAX_CRASH_POINT = Math.floor(multiplierAt(MAX_FLIGHT_SECONDS) * 100) / 100;

const WINDOW_MS = 3_600_000; // one UTC hour

export type EngineRound = {
  id: string;
  round_number: number;
  seed_hash: string;
  server_seed: string;
  betting_starts_at: string;
  flight_starts_at: string;
  crash_at: string;
  ends_at: string;
  crash_point: number;
  settled: boolean;
};

/* ---------------- deterministic randomness ---------------- */

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable 0..1 value for a given seed string. */
export function unitRandom(seed: string): number {
  let t = (hash32(seed) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * House economics.
 *
 * The crash curve is the industry-standard `(1 - edge) / (1 - r)` distribution:
 * mostly small multipliers, occasional big ones. `HOUSE_EDGE` is the long-run
 * margin the platform keeps, and `INSTANT_BUST_CHANCE` is the share of rounds
 * that fly away at 1.00x immediately (nobody can cash out) — together they keep
 * the table profitable instead of every player winning.
 */
export const HOUSE_EDGE = 0.06; // 6% margin → ~94% theoretical RTP
export const INSTANT_BUST_CHANCE = 0.04; // 4% of rounds crash at 1.00x
export const THEORETICAL_RTP = Math.round((1 - HOUSE_EDGE) * (1 - INSTANT_BUST_CHANCE) * 1000) / 10;

/** House-edge crash curve, clamped so a round can never run away. */
export function crashPointFor(seed: string): number {
  const r = unitRandom(seed);
  if (r < INSTANT_BUST_CHANCE) return 1;
  // Re-normalise the remaining space to a full 0..1 uniform.
  const u = (r - INSTANT_BUST_CHANCE) / (1 - INSTANT_BUST_CHANCE);
  const raw = (1 - HOUSE_EDGE) / Math.max(1 - u, 1e-9);
  const value = Math.floor(raw * 100) / 100;
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 1), MAX_CRASH_POINT);
}

/* ---------------- schedule ---------------- */

const cache = new Map<number, EngineRound[]>();

function buildWindow(windowStart: number): EngineRound[] {
  const rounds: EngineRound[] = [];
  let cursor = windowStart;
  let index = 0;
  const windowEnd = windowStart + WINDOW_MS;
  const roundBase = Math.floor(windowStart / WINDOW_MS) * 1000;

  while (cursor < windowEnd && index < 1000) {
    const seed = `${windowStart}:${index}`;
    const crashPoint = crashPointFor(seed);
    const flight = Math.min(flightDuration(crashPoint), MAX_FLIGHT_SECONDS);
    const flightStart = cursor + BETTING_SECONDS * 1000;
    const crashAt = flightStart + flight * 1000;
    const endsAt = crashAt + AFTER_CRASH_SECONDS * 1000;
    if (endsAt > windowEnd) break;

    rounds.push({
      id: `r-${roundBase + index}`,
      round_number: roundBase + index,
      seed_hash: hash32(`h:${seed}`).toString(16).padStart(8, "0"),
      server_seed: seed,
      betting_starts_at: new Date(cursor).toISOString(),
      flight_starts_at: new Date(flightStart).toISOString(),
      crash_at: new Date(crashAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      crash_point: crashPoint,
      settled: true,
    });

    cursor = endsAt;
    index += 1;
  }

  return rounds;
}

function windowRounds(windowStart: number): EngineRound[] {
  const cached = cache.get(windowStart);
  if (cached) return cached;
  const built = buildWindow(windowStart);
  cache.set(windowStart, built);
  if (cache.size > 4) cache.delete([...cache.keys()][0]!);
  return built;
}

/** Every round that matters right now: previous hour tail + current hour. */
export function scheduleAt(now: number): EngineRound[] {
  const currentWindow = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  return [...windowRounds(currentWindow - WINDOW_MS), ...windowRounds(currentWindow)];
}

export function currentRound(now: number): EngineRound | null {
  const list = scheduleAt(now);
  for (const round of list) {
    if (
      new Date(round.betting_starts_at).getTime() <= now &&
      new Date(round.ends_at).getTime() > now
    ) {
      return round;
    }
  }
  // Between the last round of an hour and the top of the next hour.
  return list.find((round) => new Date(round.betting_starts_at).getTime() > now) ?? null;
}

export function nextRoundAfter(round: EngineRound | null, now: number): EngineRound | null {
  if (!round) return null;
  const list = scheduleAt(now);
  const index = list.findIndex((item) => item.id === round.id);
  return index >= 0 ? (list[index + 1] ?? null) : null;
}

/** Finished rounds, newest first — the history strip. */
export function historyAt(now: number, count = 30): EngineRound[] {
  return scheduleAt(now)
    .filter((round) => new Date(round.crash_at).getTime() <= now)
    .slice(-count)
    .reverse();
}

export type Snapshot = {
  round: EngineRound | null;
  nextRound: EngineRound | null;
  phase: Phase;
  multiplier: number;
  countdown: number;
  history: EngineRound[];
};

export function snapshotAt(now: number): Snapshot {
  const round = currentRound(now);
  const nextRound = nextRoundAfter(round, now);
  const history = historyAt(now);

  if (!round) {
    return { round: null, nextRound: null, phase: "crashed", multiplier: 1, countdown: 0, history };
  }

  const flightStart = new Date(round.flight_starts_at).getTime();
  const crashAt = new Date(round.crash_at).getTime();

  if (now < flightStart) {
    // Clamp: a countdown can never exceed one betting phase.
    const countdown = Math.min(Math.max((flightStart - now) / 1000, 0), BETTING_SECONDS);
    return { round, nextRound, phase: "betting", multiplier: 1, countdown, history };
  }

  if (now >= crashAt) {
    return {
      round,
      nextRound,
      phase: "crashed",
      multiplier: round.crash_point,
      countdown: 0,
      history,
    };
  }

  const elapsed = Math.min(Math.max((now - flightStart) / 1000, 0), MAX_FLIGHT_SECONDS);
  const multiplier = Math.min(multiplierAt(elapsed), round.crash_point);
  return { round, nextRound, phase: "flying", multiplier, countdown: 0, history };
}
