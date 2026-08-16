import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

import { firebaseAuth } from "./firebase";
import { snapshotAt, type EngineRound } from "./engine";
import {
  chatFeed,
  ensureProfile,
  myBets as readMyBets,
  roundBets as readRoundBets,
  settlePending,
  subscribe,
  topWins as readTopWins,
  type ChatMessage,
  type Profile,
} from "./local-store";
import type { BetRow, Phase } from "./game";

export type PublicRound = EngineRound;
export type { ChatMessage, Profile };

/* ---------------- session ---------------- */

export function useSession({ guest = true }: { guest?: boolean } = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const guestRef = useRef(false);

  useEffect(() => {
    const auth = firebaseAuth();
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
      if (next) {
        setGuestId(null);
        ensureProfile(next.uid, next.displayName ?? next.email?.split("@")[0]);
        return;
      }
      if (!guest || guestRef.current) return;
      guestRef.current = true;
      // Guests play immediately. If anonymous auth isn't enabled on the
      // Firebase project, fall back to a purely local guest id so the table
      // never blocks on sign-in.
      void signInAnonymously(auth).catch(() => setGuestId(localGuestId()));
    });
  }, [guest]);

  const userId = user?.uid ?? guestId ?? undefined;

  useEffect(() => {
    if (userId) ensureProfile(userId);
  }, [userId]);

  return { user, userId, ready: ready && Boolean(userId) };
}

function localGuestId(): string {
  if (typeof window === "undefined") return "guest";
  const key = "aviator.guest.id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `guest-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, id);
  return id;
}

/* ---------------- local store binding ---------------- */

function useLocalVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((value) => value + 1)), []);
  return version;
}

/* ---------------- clock + round state ---------------- */

export type GameState = {
  round: PublicRound | null;
  nextRound: PublicRound | null;
  phase: Phase;
  multiplier: number;
  countdown: number;
  history: PublicRound[];
};

/**
 * Real time for everyone: the round is a pure function of the wall clock, so a
 * player who was offline resyncs the instant the tab wakes up.
 */
export function useGameState(): GameState {
  const [state, setState] = useState<GameState>(() => snapshotAt(Date.now()));

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const now = Date.now();
      settlePending(now);
      setState(snapshotAt(now));
    };
    const loop = () => {
      tick();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const timer = window.setInterval(tick, 250);
    const resync = () => tick();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    window.addEventListener("online", resync);
    window.addEventListener("pageshow", resync);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
      window.removeEventListener("online", resync);
      window.removeEventListener("pageshow", resync);
    };
  }, []);

  return state;
}

/* ---------------- player data ---------------- */

export function useProfile(userId: string | undefined): Profile | null {
  const version = useLocalVersion();
  return useMemo(
    () => (userId ? ensureProfile(userId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, version],
  );
}

export function useRoundBets(roundId: string | null, multiplier: number, phase: Phase): BetRow[] {
  const version = useLocalVersion();
  return useMemo(
    () => readRoundBets(roundId, multiplier, phase),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundId, Math.floor(multiplier * 20), phase, version],
  );
}

export function useMyBets(userId: string | undefined): BetRow[] {
  const version = useLocalVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readMyBets(userId), [userId, version]);
}

export function useTopWins(): BetRow[] {
  const version = useLocalVersion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readTopWins(), [version]);
}

/* ---------------- chat ---------------- */

export function useChat(roundId: string | null): ChatMessage[] {
  const version = useLocalVersion();
  return useMemo(
    () => chatFeed(Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roundId, version],
  );
}

/** Kept for components that just need a manual refresh trigger. */
export function useRefresh(): () => void {
  const [, setValue] = useState(0);
  return useCallback(() => setValue((current) => current + 1), []);
}

export { useSyncExternalStore };
