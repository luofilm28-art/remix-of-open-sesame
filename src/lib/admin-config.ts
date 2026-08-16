/**
 * The ONLY Firestore data in this app: betting-platform (operator) configs
 * managed by the owner in /admin. No game data is ever written here.
 */
import { collection, deleteDoc, doc, getDocs, setDoc, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";

export type Operator = {
  slug: string;
  name: string;
  api_secret: string;
  wallet_url: string;
  allowed_origins: string[];
  currency: string;
  /** Money rules the platform runs with (any amount, not a fixed step). */
  min_stake: number;
  max_stake: number;
  stake_step: number;
  active: boolean;
  created_at?: string;
};

export async function listOperators(): Promise<Operator[]> {
  const snap = await getDocs(collection(db(), "operators"));
  return snap.docs.map((item) => {
    const data = item.data() as DocumentData;
    return {
      slug: item.id,
      name: (data['name'] as string) ?? item.id,
      api_secret: (data['api_secret'] as string) ?? "",
      wallet_url: (data['wallet_url'] as string) ?? "",
      allowed_origins: (data['allowed_origins'] as string[]) ?? [],
      currency: (data['currency'] as string) ?? "UGX",
      min_stake: Number(data['min_stake'] ?? 500),
      max_stake: Number(data['max_stake'] ?? 1000000),
      stake_step: Number(data['stake_step'] ?? data['min_stake'] ?? 500),
      active: data['active'] !== false,
      created_at: (data['created_at'] as string) ?? undefined,
    };
  });
}

export async function saveOperator(operator: Operator): Promise<void> {
  const { slug, ...rest } = operator;
  await setDoc(
    doc(db(), "operators", slug),
    { ...rest, created_at: operator.created_at ?? new Date().toISOString() },
    { merge: true },
  );
}

/** Bulk import — used to copy platforms over from a previous project. */
export async function importOperators(operators: Operator[]): Promise<number> {
  for (const operator of operators) {
    if (!operator.slug) continue;
    await saveOperator(operator);
  }
  return operators.length;
}

export async function deleteOperator(slug: string): Promise<void> {
  await deleteDoc(doc(db(), "operators", slug));
}

export function newApiSecret(): string {
  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}
