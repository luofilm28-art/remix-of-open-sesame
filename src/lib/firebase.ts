/**
 * Firebase is used for TWO things only:
 *   1. Authentication (Google sign-in + email/password + anonymous guests)
 *   2. The admin dashboard config (operators collection, written only by the owner)
 *
 * The live game itself writes NOTHING to Firestore — rounds are derived from a
 * shared deterministic clock (see ./engine.ts) so every player, on any device,
 * always sees exactly the same round even after going offline and coming back.
 *
 * The web API key below is a public client identifier; access is controlled by
 * Firestore rules. There is no service account anywhere in this app.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDq7bVfYdvlGiJk3E62tGUK88NlYhc7eR0",
  authDomain: "aviator-2-bd626.firebaseapp.com",
  projectId: "aviator-2-bd626",
  storageBucket: "aviator-2-bd626.firebasestorage.app",
  messagingSenderId: "495197585481",
  appId: "1:495197585481:web:01ead3b7e97500829d7f98",
  measurementId: "G-XL1V11DF4Q",
};

/** Public OAuth web client id used for Google sign-in. */
export const GOOGLE_WEB_CLIENT_ID =
  "495197585481-qevb467uasu9v0jbeebv137g849rqkmi.apps.googleusercontent.com";

/** Emails allowed into /admin (both owner accounts). */
export const ADMIN_EMAILS = [
  "nexusplatformafrica@gmail.com",
  "mainplatform.nexus@gmail.com",
] as const;

/** Primary owner account, shown in sign-in copy. */
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export function isAdminEmail(email: string | null | undefined): boolean {
  const value = email?.trim().toLowerCase();
  return Boolean(value) && ADMIN_EMAILS.includes(value as (typeof ADMIN_EMAILS)[number]);
}

export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

/** Firestore holds admin configuration only. */
export function db(): Firestore {
  return getFirestore(firebaseApp());
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account", client_id: GOOGLE_WEB_CLIENT_ID });
  return provider;
}

/** Analytics is browser-only and optional — never import it during SSR. */
export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) getAnalytics(firebaseApp());
  } catch {
    /* analytics is best-effort */
  }
}
