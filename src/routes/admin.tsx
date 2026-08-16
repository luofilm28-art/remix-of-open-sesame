import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { BookOpen, Copy, Download, FileDown, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { ADMIN_EMAILS, firebaseAuth, googleProvider, isAdminEmail } from "@/lib/firebase";
import { buildIntegrationDoc, downloadIntegrationDoc } from "@/lib/integration-doc";
import {
  deleteOperator,
  importOperators,
  listOperators,
  newApiSecret,
  saveOperator,
  type Operator,
} from "@/lib/admin-config";
import { buildEmbedUrl } from "@/lib/table-config";

const embedUrlFor = (origin: string, operator: Operator) =>
  buildEmbedUrl(origin, {
    operator: operator.slug,
    currency: operator.currency,
    minStake: operator.min_stake,
    maxStake: operator.max_stake,
    step: operator.stake_step,
  });

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin · Aviator Platform Integrations" },
      {
        name: "description",
        content:
          "Owner dashboard to create betting-platform integrations: operator slug, API secret, wallet endpoint, allowed origins and currency.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin · Aviator Platform Integrations" },
      {
        property: "og:description",
        content: "Manage operator integrations for the Aviator crash game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const emptyOperator = (): Operator => ({
  slug: "",
  name: "",
  api_secret: newApiSecret(),
  wallet_url: "",
  allowed_origins: [],
  currency: "UGX",
  min_stake: 500,
  max_stake: 1000000,
  stake_step: 500,
  active: true,
});

function AdminPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [draft, setDraft] = useState<Operator>(emptyOperator);
  const [originsText, setOriginsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const isAdmin = isAdminEmail(email);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth(), (user) => {
      setEmail(user?.email ?? null);
      setReady(true);
    });
  }, []);

  const reload = useMemo(
    () => async () => {
      try {
        setOperators(await listOperators());
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    [],
  );

  useEffect(() => {
    if (isAdmin) void reload();
  }, [isAdmin, reload]);

  const signIn = async () => {
    try {
      await signInWithPopup(firebaseAuth(), googleProvider());
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const slug = draft.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!slug) {
      toast.error("Slug is required");
      return;
    }
    setBusy(true);
    try {
      await saveOperator({
        ...draft,
        slug,
        name: draft.name || slug,
        allowed_origins: originsText
          .split(/[\s,]+/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success(`Integration “${slug}” saved`);
      setDraft(emptyOperator());
      setOriginsText("");
      await reload();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const edit = (operator: Operator) => {
    setDraft(operator);
    setOriginsText(operator.allowed_origins.join("\n"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (slug: string) => {
    if (!window.confirm(`Delete integration “${slug}”?`)) return;
    await deleteOperator(slug);
    toast.success("Integration deleted");
    await reload();
  };

  /** Copy every configured platform out of one project and into another. */
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(operators, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aviator-platforms.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importAll = async (file: File) => {
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as Operator[];
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array of platforms");
      const count = await importOperators(parsed);
      toast.success(`Imported ${count} platform${count === 1 ? "" : "s"}`);
      await reload();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = (value: string) => {
    void navigator.clipboard.writeText(value);
    toast.success("Copied");
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="panel-surface w-full max-w-sm p-6 text-center">
          <h1 className="font-display text-lg font-bold text-foreground">Admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email
              ? `${email} is not an owner account. Sign in with ${ADMIN_EMAILS.join(" or ")}.`
              : "Sign in with the owner Google account to manage platform integrations."}
          </p>
          <button type="button" onClick={signIn} className="btn-bet mt-5 w-full py-2.5 text-sm">
            Continue with Google
          </button>
          {email ? (
            <button
              type="button"
              onClick={() => void signOut(firebaseAuth())}
              className="mt-3 w-full text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary neon-text">Admin</h1>
          <p className="text-xs text-muted-foreground">Platform integrations · {email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportAll}
            className="flex items-center gap-1.5 rounded-md bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground">
            <Upload className="h-3.5 w-3.5" /> Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void importAll(file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void signOut(firebaseAuth())}
            className="rounded-md bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="panel-surface mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-foreground">
              <BookOpen className="h-4 w-4" /> Integration documentation
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Everything a betting platform needs to embed the table — share or download it as Markdown.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDocsOpen((open) => !open)}
              className="rounded-md bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {docsOpen ? "Hide" : "Read"}
            </button>
            <button
              type="button"
              onClick={() => copy(buildIntegrationDoc(origin, operators))}
              className="flex items-center gap-1.5 rounded-md bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={() => downloadIntegrationDoc(origin, operators)}
              className="btn-bet flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
            >
              <FileDown className="h-3.5 w-3.5" /> Download guide
            </button>
          </div>
        </div>
        {docsOpen ? (
          <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-elevated p-4 text-[11px] leading-relaxed text-muted-foreground">
            {buildIntegrationDoc(origin, operators)}
          </pre>
        ) : null}
      </section>

      <section className="panel-surface mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-foreground">
          <Plus className="h-4 w-4" /> New / edit integration
        </h2>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug (operator id)">
            <input
              className="stepper-input font-sans"
              value={draft.slug}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              placeholder="mybet"
              required
            />
          </Field>
          <Field label="Display name">
            <input
              className="stepper-input font-sans"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="MyBet Uganda"
            />
          </Field>
          <Field label="API secret (HMAC key)">
            <div className="flex gap-1">
              <input
                className="stepper-input font-mono text-[11px]"
                value={draft.api_secret}
                onChange={(event) => setDraft({ ...draft, api_secret: event.target.value })}
              />
              <button
                type="button"
                aria-label="Generate new secret"
                onClick={() => setDraft({ ...draft, api_secret: newApiSecret() })}
                className="rounded-md bg-elevated px-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Copy secret"
                onClick={() => copy(draft.api_secret)}
                className="rounded-md bg-elevated px-2 text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </Field>
          <Field label="Wallet URL (your endpoint)">
            <input
              className="stepper-input font-sans"
              value={draft.wallet_url}
              onChange={(event) => setDraft({ ...draft, wallet_url: event.target.value })}
              placeholder="https://mybet.com/api/aviator/wallet"
              type="url"
            />
          </Field>
          <Field label="Currency">
            <input
              className="stepper-input font-sans"
              value={draft.currency}
              onChange={(event) => setDraft({ ...draft, currency: event.target.value })}
              placeholder="UGX"
            />
          </Field>
          <Field label="Minimum stake">
            <input
              className="stepper-input font-sans"
              inputMode="decimal"
              value={draft.min_stake}
              onChange={(event) =>
                setDraft({ ...draft, min_stake: Number(event.target.value) || 0 })
              }
              placeholder="500"
            />
          </Field>
          <Field label="Maximum stake">
            <input
              className="stepper-input font-sans"
              inputMode="decimal"
              value={draft.max_stake}
              onChange={(event) =>
                setDraft({ ...draft, max_stake: Number(event.target.value) || 0 })
              }
              placeholder="1000000"
            />
          </Field>
          <Field label="Stake step (+/- increment — any amount)">
            <input
              className="stepper-input font-sans"
              inputMode="decimal"
              value={draft.stake_step}
              onChange={(event) =>
                setDraft({ ...draft, stake_step: Number(event.target.value) || 0 })
              }
              placeholder="500"
            />
          </Field>
          <Field label="Allowed embed origins (one per line)">
            <textarea
              className="stepper-input min-h-[38px] font-sans"
              value={originsText}
              onChange={(event) => setOriginsText(event.target.value)}
              placeholder="https://mybet.com"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              className="h-3.5 w-3.5 accent-[oklch(0.7_0.2_147)]"
            />
            Active
          </label>
          <button type="submit" disabled={busy} className="btn-bet py-2.5 text-sm">
            Save integration
          </button>
        </form>
      </section>

      <section className="panel-surface p-5">
        <h2 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-foreground">
          Integrations ({operators.length})
        </h2>
        {operators.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No platforms yet. Create one above, then share the slug and secret with the operator.
          </p>
        ) : (
          <ul className="space-y-3">
            {operators.map((operator) => (
              <li key={operator.slug} className="rounded-lg bg-elevated p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm text-foreground">
                      {operator.name}{" "}
                      <span className="text-muted-foreground">({operator.slug})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {operator.currency} · {operator.active ? "active" : "disabled"} ·{" "}
                      min {operator.min_stake.toLocaleString()} · max{" "}
                      {operator.max_stake.toLocaleString()} · step{" "}
                      {operator.stake_step.toLocaleString()} ·{" "}
                      {operator.wallet_url || "no wallet URL"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => edit(operator)}
                      className="rounded-md bg-secondary px-3 py-1 text-[11px] uppercase tracking-wide text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${operator.slug}`}
                      onClick={() => void remove(operator.slug)}
                      className="rounded-md bg-secondary px-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 font-mono text-[11px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => copy(operator.api_secret)}
                    className="truncate text-left hover:text-foreground"
                  >
                    secret: {operator.api_secret}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`${origin}/api/public/operator/launch`)}
                    className="truncate text-left hover:text-foreground"
                  >
                    launch: {origin}/api/public/operator/launch
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(embedUrlFor(origin, operator))}
                    className="truncate text-left hover:text-foreground"
                  >
                    embed: {embedUrlFor(origin, operator)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Full integration steps live in <span className="font-mono">INTEGRATION.md</span>.
      </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
