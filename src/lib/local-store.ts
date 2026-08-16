/**
 * Player state lives on the device — nothing is written to Firestore.
 *
 * Balance, bets and history are kept in localStorage, and every round is
 * settled locally against the shared deterministic schedule, so results are
 * identical for every player watching the same round.
 */
import { avatarColor, type BetRow } from "./game";
import { currentRound, scheduleAt, unitRandom } from "./engine";

export const STARTING_BALANCE = 10000;

/** House rules: no stake below 500 UGX, no stake above 1,000,000 UGX. */
export const MIN_BET = 500;
export const MAX_BET = 1000000;

export type Profile = {
  id: string;
  username: string;
  avatar_seed: string;
  balance: number;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: { username: string; avatar_seed: string } | null;
};

type State = { profile: Profile | null; bets: BetRow[]; chat: ChatMessage[] };

const KEY = "aviator.local.v1";
const listeners = new Set<() => void>();

let state: State = { profile: null, bets: [], chat: [] };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function load(): void {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>;
      state = { profile: saved.profile ?? null, bets: saved.bets ?? [], chat: [] };
    }
  } catch {
    /* corrupted storage — start fresh */
  }
}

function persist(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ profile: state.profile, bets: state.bets.slice(-120) }),
    );
  } catch {
    /* quota — ignore */
  }
  listeners.forEach((fn) => fn());
}

load();

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------------- profile ---------------- */

export function ensureProfile(userId: string, username?: string | null): Profile {
  if (!state.profile || state.profile.id !== userId) {
    state.profile = {
      id: userId,
      username: (username || `player${userId.slice(0, 4)}`).slice(0, 20),
      avatar_seed: userId,
      balance: state.profile?.balance ?? STARTING_BALANCE,
    };
    persist();
  } else if (username && state.profile.username !== username) {
    state.profile.username = username.slice(0, 20);
    persist();
  }
  return state.profile;
}

export function readProfile(userId: string): Profile | null {
  if (!state.profile || state.profile.id !== userId) return null;
  return state.profile;
}

/* ---------------- bets ---------------- */

export function placeBet(input: {
  userId: string;
  roundId: string;
  amount: number;
  autoCashout: number | null;
  slot: number;
  /** Per-platform stake rules; falls back to the house defaults. */
  limits?: { min?: number; max?: number; currency?: string };
}): void {
  const profile = state.profile;
  const min = input.limits?.min ?? MIN_BET;
  const max = input.limits?.max ?? MAX_BET;
  const currency = input.limits?.currency ?? "UGX";
  if (!profile) throw new Error("Profile not ready");
  if (!Number.isFinite(input.amount) || input.amount < min)
    throw new Error(`Minimum bet is ${min.toLocaleString()} ${currency}`);
  if (input.amount > max) throw new Error(`Maximum bet is ${max.toLocaleString()} ${currency}`);
  if (profile.balance < input.amount) throw new Error("Insufficient balance");

  profile.balance = Math.round((profile.balance - input.amount) * 100) / 100;
  state.bets.push({
    id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    round_id: input.roundId,
    user_id: input.userId,
    slot: input.slot,
    amount: input.amount,
    auto_cashout: input.autoCashout,
    cashout_multiplier: null,
    payout: null,
    result: "pending",
    created_at: new Date().toISOString(),
    profiles: { username: profile.username, avatar_seed: profile.avatar_seed },
  });
  persist();
}

export function cashOut(betId: string, multiplier: number): BetRow | null {
  const bet = state.bets.find((item) => item.id === betId);
  if (!bet) throw new Error("Bet not found");
  if (bet.result !== "pending") throw new Error("Bet already settled");

  const value = Math.max(1, Math.floor(multiplier * 100) / 100);
  const payout = Math.floor(bet.amount * value * 100) / 100;
  bet.result = "won";
  bet.cashout_multiplier = value;
  bet.payout = payout;
  if (state.profile) {
    state.profile.balance = Math.round((state.profile.balance + payout) * 100) / 100;
  }
  persist();
  return bet;
}

export function cancelBet(betId: string): void {
  const bet = state.bets.find((item) => item.id === betId);
  if (!bet || bet.result !== "pending") throw new Error("Bet already settled");
  bet.result = "cancelled";
  bet.payout = 0;
  if (state.profile) {
    state.profile.balance = Math.round((state.profile.balance + bet.amount) * 100) / 100;
  }
  persist();
}

/**
 * Settles every pending bet whose round already crashed (auto cash-out wins,
 * everything else loses). Safe to call on every tick, including right after
 * the player comes back online.
 */
export function settlePending(now: number): void {
  const rounds = new Map(scheduleAt(now).map((round) => [round.id, round]));
  let changed = false;

  for (const bet of state.bets) {
    if (bet.result !== "pending") continue;
    const round = rounds.get(bet.round_id);
    if (!round) continue;
    if (new Date(round.crash_at).getTime() > now) continue;

    const auto = bet.auto_cashout;
    const won = auto != null && auto <= round.crash_point;
    bet.result = won ? "won" : "lost";
    bet.cashout_multiplier = won ? auto : null;
    bet.payout = won ? Math.floor(bet.amount * auto! * 100) / 100 : 0;
    if (won && state.profile) {
      state.profile.balance = Math.round((state.profile.balance + bet.payout) * 100) / 100;
    }
    changed = true;
  }

  if (changed) persist();
}

export function myBets(userId: string | undefined): BetRow[] {
  if (!userId) return [];
  return [...state.bets].reverse().slice(0, 50);
}

export function topWins(): BetRow[] {
  return [...state.bets]
    .filter((bet) => bet.result === "won")
    .sort((a, b) => Number(b.payout ?? 0) - Number(a.payout ?? 0))
    .slice(0, 20);
}

/* ---------------- shared table feed ---------------- */

const NAMES = [
  "skyhunter", "jetlag", "nova", "kiprop", "zawadi", "flyboy", "amani", "tumaini",
  "rocket", "bahati", "kelvo", "mamba", "orion", "asha", "juma", "pilotx",
  "zuri", "kofi", "neema", "tafari", "lulu", "dede", "sifa", "chidi",
];

/** The bot table is derived from the round id, so every player sees it identically. */
export function tableBets(roundId: string | null, multiplier: number, phase: string): BetRow[] {
  if (!roundId) return [];
  const count = 9 + Math.floor(unitRandom(`n:${roundId}`) * 14);
  const rows: BetRow[] = [];

  for (let i = 0; i < count; i += 1) {
    const seed = `${roundId}:${i}`;
    const name = NAMES[Math.floor(unitRandom(`u:${seed}`) * NAMES.length)]!;
    const amount = Math.round((MIN_BET + unitRandom(`a:${seed}`) * 49500) / 100) * 100;
    const target = Math.round((1.15 + unitRandom(`c:${seed}`) * 6) * 100) / 100;
    const cashed = phase !== "betting" && multiplier >= target;

    rows.push({
      id: `${roundId}-bot-${i}`,
      round_id: roundId,
      user_id: `bot-${i}`,
      slot: 1,
      amount,
      auto_cashout: null,
      cashout_multiplier: cashed ? target : null,
      payout: cashed ? Math.floor(amount * target * 100) / 100 : null,
      result: cashed ? "won" : phase === "crashed" ? "lost" : "pending",
      created_at: new Date().toISOString(),
      profiles: { username: name, avatar_seed: name },
    });
  }

  return rows.sort((a, b) => b.amount - a.amount);
}

export function roundBets(roundId: string | null, multiplier: number, phase: string): BetRow[] {
  const mine = state.bets.filter((bet) => bet.round_id === roundId);
  return [...mine, ...tableBets(roundId, multiplier, phase)].sort((a, b) => b.amount - a.amount);
}

/* ---------------- chat (in-memory, never stored) ---------------- */

const CHAT_LINES = [
  "that one flew away fast", "cash out early 😅", "1.2x again?!", "big one coming",
  "auto at 2x is the way", "green round finally", "hold hold hold", "took 5x 🚀",
  "my heart 😂", "let's go pilots", "next one is mine", "clean round",
];

/** Ambient table chat, seeded per minute so everyone reads the same lines. */
export function ambientChat(now: number): ChatMessage[] {
  const round = currentRound(now);
  const key = round?.id ?? String(Math.floor(now / 60000));
  return Array.from({ length: 8 }, (_, index) => {
    const seed = `${key}:${index}`;
    const name = NAMES[Math.floor(unitRandom(`cu:${seed}`) * NAMES.length)]!;
    return {
      id: `chat-${seed}`,
      user_id: `bot-${index}`,
      message: CHAT_LINES[Math.floor(unitRandom(`cm:${seed}`) * CHAT_LINES.length)]!,
      created_at: new Date(now).toISOString(),
      profiles: { username: name, avatar_seed: name },
    };
  });
}

export function sendChat(userId: string, message: string): void {
  const profile = state.profile;
  state.chat = [
    ...state.chat,
    {
      id: `chat-me-${Date.now()}`,
      user_id: userId,
      message: message.slice(0, 200),
      created_at: new Date().toISOString(),
      profiles: {
        username: profile?.username ?? "you",
        avatar_seed: profile?.avatar_seed ?? userId,
      },
    },
  ].slice(-40);
  listeners.forEach((fn) => fn());
}

export function chatFeed(now: number): ChatMessage[] {
  return [...ambientChat(now), ...state.chat].sort((a, b) =>
    a.created_at < b.created_at ? -1 : 1,
  );
}

export { avatarColor };
