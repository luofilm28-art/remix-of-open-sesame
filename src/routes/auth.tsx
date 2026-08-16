import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { ensureProfile } from "@/lib/local-store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Aviator Crash Game" },
      {
        name: "description",
        content:
          "Create an account or sign in with Google to play the Aviator crash game with live multipliers, chat and instant cash-outs.",
      },
      { property: "og:title", content: "Sign in · Aviator Crash Game" },
      {
        property: "og:description",
        content: "Join the Aviator crash table and cash out before the plane flies away.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), (user) => {
      if (user && !user.isAnonymous) void navigate({ to: "/" });
    });
  }, [navigate]);

  const withGoogle = async () => {
    setBusy(true);
    try {
      const credential = await signInWithPopup(firebaseAuth(), googleProvider());
      ensureProfile(
        credential.user.uid,
        credential.user.displayName ?? credential.user.email?.split("@")[0],
      );
      void navigate({ to: "/" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const auth = firebaseAuth();
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const name = username || email.split("@")[0]!;
        await updateProfile(credential.user, { displayName: name });
        ensureProfile(credential.user.uid, name);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        ensureProfile(credential.user.uid, credential.user.displayName);
      }
      void navigate({ to: "/" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel-surface w-full max-w-sm p-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Plane className="h-6 w-6 -rotate-12 text-primary" />
          <h1 className="font-display text-2xl font-bold text-primary neon-text">Aviator</h1>
        </div>

        <div className="mb-5 flex rounded-full bg-elevated p-0.5">
          {(["login", "register"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 rounded-full py-1.5 font-display text-xs uppercase tracking-wide ${
                mode === item ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              {item === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={withGoogle}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-elevated py-2.5 font-display text-xs uppercase tracking-wide text-foreground transition-colors hover:bg-secondary"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9H1.3v3.1A12 12 0 0 0 12 24Z"
            />
            <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
            />
          </svg>
          Continue with Google
        </button>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" ? (
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
                Username
              </label>
              <input
                className="stepper-input font-sans"
                value={username}
                maxLength={20}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="skyhunter"
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <input
              className="stepper-input font-sans"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
              Password
            </label>
            <input
              className="stepper-input font-sans"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-bet py-2.5 text-sm">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          New accounts start with 1,000 demo credits. This table plays for virtual credits only.
        </p>
      </div>
    </main>
  );
}
