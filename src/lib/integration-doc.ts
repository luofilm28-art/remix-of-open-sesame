/**
 * Integration handbook shown (and downloadable) in /admin.
 *
 * Kept as a plain string builder so the same text can be rendered in the
 * dashboard, copied to the clipboard, or saved as a Markdown file.
 */
import type { Operator } from "./admin-config";
import { STARTING_BALANCE } from "./local-store";
import { ADMIN_EMAILS } from "./firebase";
import { HOUSE_EDGE, INSTANT_BUST_CHANCE, THEORETICAL_RTP, MAX_CRASH_POINT } from "./engine";
import { buildEmbedUrl, DEFAULT_TABLE_CONFIG } from "./table-config";

export function buildIntegrationDoc(origin: string, operators: Operator[] = []): string {
  const base = origin || "https://your-aviator-domain.com";
  const example = operators[0]?.slug ?? "mybet";

  const table = operators.length
    ? operators
        .map(
          (op) =>
            `| ${op.name || op.slug} | \`${op.slug}\` | ${op.currency} | ${op.min_stake?.toLocaleString() ?? "-"} / ${op.max_stake?.toLocaleString() ?? "-"} | ${op.stake_step?.toLocaleString() ?? "-"} | ${op.active ? "active" : "paused"} | ${buildEmbedUrl(base, { operator: op.slug, currency: op.currency, minStake: op.min_stake, maxStake: op.max_stake, step: op.stake_step })} |`,
        )
        .join("\n")
    : "| _no platforms configured yet_ | | | | | | |";

  return `# Aviator — Platform Integration Guide

_Generated ${new Date().toISOString().slice(0, 10)} from ${base}_

## 1. What this game is

A real-time Aviator (crash) table. Every round is derived from a **shared
deterministic clock**: the round id, start time and crash point are computed
from the UTC wall clock, so every player on every device sees exactly the same
round at the same moment — even after going offline and coming back. Nothing
about live rounds is stored in a database, so the table never slows down and
never fills your storage.

- Betting window, flight and crash are identical for all viewers.
- A player who reloads or reconnects rejoins the round already in progress.
- Flight time is hard-capped, so a round can never run away with a huge timer.

## 2. Your money rules (you set them, not us)

Every platform runs its own currency and stake ladder. Set them in \`/admin\`
(or pass them on the embed URL) — the stake box, the +/- buttons and the quick
chips all follow your numbers. **There is no fixed step of 5 or 500**: the
increment is any amount you choose.

| Setting | URL parameter | Meaning | Default |
| --- | --- | --- | --- |
| Currency | \`currency\` | any ISO code, e.g. \`UGX\`, \`KES\`, \`NGN\`, \`TZS\`, \`ZMW\`, \`USD\` | ${DEFAULT_TABLE_CONFIG.currency} |
| Minimum stake | \`min\` | smallest accepted bet | ${DEFAULT_TABLE_CONFIG.minStake.toLocaleString()} |
| Maximum stake | \`max\` | largest accepted bet | ${DEFAULT_TABLE_CONFIG.maxStake.toLocaleString()} |
| Stake step | \`step\` | +/- increment, any amount (e.g. \`1\`, \`10\`, \`0.5\`) | equals your minimum |
| Quick chips | \`chips\` | up to 4 preset stakes, comma separated | derived from your minimum |
| Demo balance | — | offline/demo play only | ${STARTING_BALANCE.toLocaleString()} |

## 3. Embedding the game

Add one iframe to your site with your slug and money rules:

\`\`\`html
<iframe
  src="${buildEmbedUrl(base, { operator: example, currency: "KES", minStake: 20, maxStake: 500000, step: 10, quickStakes: [20, 50, 100, 500] })}"
  title="Aviator"
  style="width:100%;height:720px;border:0"
  allow="autoplay"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
\`\`\`

That example runs the table in **KES**, minimum 20, maximum 500,000, adjusted in
steps of 10. Swap in your own values; anything you omit falls back to the
defaults saved for your platform in the admin dashboard.

Responsive wrapper (keeps a good ratio on mobile):

\`\`\`html
<div style="position:relative;width:100%;aspect-ratio:16/10">
  <iframe src="${base}/embed?operator=${example}"
    style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
</div>
\`\`\`

Requirements:
- Serve your page over **HTTPS**.
- Add every domain that will host the iframe to **Allowed origins** for your
  platform in the admin dashboard (one per line, e.g. \`https://mybet.co.ug\`).
- Do not sandbox the frame without \`allow-scripts allow-same-origin\`.

## 4. Getting a platform account

Ask the owner (${ADMIN_EMAILS.join(" or ")}) to create your integration in
\`/admin\`. You receive:

| Field | Meaning |
| --- | --- |
| **Slug** | your platform id, used in the embed URL |
| **Display name** | shown to the operator team |
| **API secret** | HMAC key — server-side only, never ship it to a browser |
| **Wallet URL** | your endpoint for balance/debit/credit callbacks |
| **Allowed origins** | domains permitted to embed the table |
| **Currency** | currency label shown in the UI |
| **Active** | pause an integration without deleting it |

## 5. Wallet callbacks (optional)

If you set a **Wallet URL**, requests are signed with your API secret so you can
verify they really came from the game:

\`\`\`
POST <wallet_url>
X-Aviator-Operator: ${example}
X-Aviator-Timestamp: 1734512345
X-Aviator-Signature: hex(HMAC_SHA256(api_secret, timestamp + "." + rawBody))
Content-Type: application/json

{ "type": "debit", "user_ref": "player-123", "amount": 500, "round_id": "r-123456", "reference": "bet-abc" }
\`\`\`

Verify like this (Node.js):

\`\`\`js
import { createHmac, timingSafeEqual } from "crypto";

function verify(rawBody, headers, apiSecret) {
  const ts = headers["x-aviator-timestamp"];
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // 5 min window
  const expected = createHmac("sha256", apiSecret).update(\`\${ts}.\${rawBody}\`).digest("hex");
  const got = Buffer.from(String(headers["x-aviator-signature"]), "utf8");
  return got.length === expected.length &&
    timingSafeEqual(got, Buffer.from(expected, "utf8"));
}
\`\`\`

Respond with \`200\` and \`{ "balance": <new balance> }\`. Any non-200 reply
cancels the operation. Always make \`reference\` idempotent on your side.

## 5b. Game economics (why the table is profitable)

The crash point of every round is drawn from the standard crash distribution
\`(1 - house edge) / (1 - random)\`, plus a share of rounds that fly away
instantly at 1.00x. Players cannot all win: most rounds crash low, big
multipliers are rare, and the long-run margin stays with the platform.

| Parameter | Value |
| --- | --- |
| House edge | ${(HOUSE_EDGE * 100).toFixed(0)}% |
| Instant bust rounds (1.00x) | ${(INSTANT_BUST_CHANCE * 100).toFixed(0)}% |
| Theoretical RTP | ~${THEORETICAL_RTP}% |
| Maximum multiplier | ${MAX_CRASH_POINT.toLocaleString()}x |
| Round outcome | identical for every player worldwide (shared clock) |

Expected platform revenue ≈ \`total staked × ${(100 - THEORETICAL_RTP).toFixed(0)}%\`
over a large number of rounds. Short sessions still swing both ways — that is
what keeps the game fun — but the margin is fixed and provable per round via the
round seed.

## 6. Your platforms

| Platform | Slug | Currency | Min / Max | Step | Status | Embed URL |
| --- | --- | --- | --- | --- | --- | --- |
${table}

## 7. Moving platforms between environments

In \`/admin\`: **Export** downloads every configured platform as JSON, and
**Import** loads that file into another deployment — useful when copying an
existing setup into a new Firebase project. Secrets are included in the export,
so store the file securely and delete it once imported.

## 8. Admin & sign-in

- Admin dashboard: \`${base}/admin\` — Google sign-in, restricted to
  ${ADMIN_EMAILS.map((email) => `\`${email}\``).join(" and ")}.
- Players sign in with Google or email/password, or play instantly as guests.
- The game holds no service-account credentials; only the public web client id
  is used, and the database stores admin configuration only.

## 9. Go-live checklist

1. Platform created in \`/admin\`, marked **active**.
2. Embed domain listed under **Allowed origins**.
3. Iframe loads over HTTPS and shows the live table.
4. Currency, minimum, maximum and step configured for your platform and mirrored
   in your own wallet rules.
5. Wallet endpoint verifies the HMAC signature and is idempotent.
6. Two admins can sign in and reach \`/admin\`.

Support: ${ADMIN_EMAILS[0]}
`;
}

export function downloadIntegrationDoc(origin: string, operators: Operator[] = []): void {
  const blob = new Blob([buildIntegrationDoc(origin, operators)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "aviator-integration-guide.md";
  link.click();
  URL.revokeObjectURL(url);
}
