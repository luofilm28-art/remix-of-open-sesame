export const GROWTH_RATE = 0.07;
export const BETTING_SECONDS = 6;

export type Round = {
  id: string;
  round_number: number;
  seed_hash: string;
  server_seed: string;
  crash_point: number;
  betting_starts_at: string;
  flight_starts_at: string;
  crash_at: string;
  ends_at: string;
  settled: boolean;
};

export type Phase = "betting" | "flying" | "crashed";

export type BetRow = {
  id: string;
  round_id: string;
  user_id: string;
  slot: number;
  amount: number;
  auto_cashout: number | null;
  cashout_multiplier: number | null;
  payout: number | null;
  result: string;
  created_at: string;
  profiles?: { username: string; avatar_seed: string } | null;
};

export function multiplierAt(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 1;
  return Math.exp(GROWTH_RATE * elapsedSeconds);
}

export function flightDuration(crashPoint: number): number {
  return Math.log(Math.max(crashPoint, 1)) / GROWTH_RATE;
}

export function phaseOf(round: Round, nowMs: number): Phase {
  if (nowMs < new Date(round.flight_starts_at).getTime()) return "betting";
  if (nowMs < new Date(round.crash_at).getTime()) return "flying";
  return "crashed";
}

export function liveMultiplier(round: Round, nowMs: number): number {
  const start = new Date(round.flight_starts_at).getTime();
  const crash = new Date(round.crash_at).getTime();
  if (nowMs <= start) return 1;
  if (nowMs >= crash) return round.crash_point;
  const value = multiplierAt((nowMs - start) / 1000);
  return Math.min(value, round.crash_point);
}

export function formatMultiplier(value: number): string {
  return `${(Math.floor(value * 100) / 100).toFixed(2)}x`;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function multiplierTone(value: number): "low" | "mid" | "high" {
  if (value < 2) return "low";
  if (value < 10) return "mid";
  return "high";
}

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }
  return `oklch(0.55 0.16 ${hash})`;
}

export function maskName(name: string): string {
  if (name.length <= 2) return `${name[0] ?? "p"}***`;
  return `${name.slice(0, 1)}***${name.slice(-1)}`;
}
