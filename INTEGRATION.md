# Aviator — Firebase setup, admin console & platform integration

Everything the game needs lives in **Firebase project `aviator-bet-plus`**:
Firebase Auth for players, Cloud Firestore for rounds/bets/chat/profiles, and a
small server layer (TanStack server functions) that talks to betting platforms.

---

## 1. Firebase configuration

Client config lives in `src/lib/firebase.ts`. The web API key is a public
identifier — it is safe in the bundle; access is controlled by Firestore rules.

In the Firebase console:

1. **Authentication → Sign-in method** → enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains** → add your preview domain,
   your `.lovable.app` domain and any custom domain.
3. **Firestore Database** → create the database (production mode).
4. Publish the rules from [`firestore.rules`](./firestore.rules).

### Server credentials (required for platform integrations)

Server-side work (minting player sessions, wallet sync) uses a **service
account**:

1. Firebase console → ⚙️ **Project settings → Service accounts → Generate new
   private key**.
2. Save the whole JSON file contents as the secret **`FIREBASE_SERVICE_ACCOUNT`**.

Without it the game still runs standalone; only operator launch/wallet calls fail.

### Collections

| Collection            | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `rounds/{id}`         | one crash round: crash point, phase, timestamps           |
| `rounds/{id}/bets`    | every bet in the round, cash-out multiplier and payout    |
| `profiles/{uid}`      | username, avatar, balance, operator link                  |
| `chat`                | live chat messages                                        |
| `operators/{slug}`    | platform integrations (slug, HMAC secret, wallet URL)     |
| `operator_sessions`   | short-lived launch tokens (server only)                   |
| `wallet_transfers`    | idempotent ledger of debits/credits pushed to a platform  |

---

## 2. Admin dashboard — `/admin`

Sign in with Google as **nexusplatformafrica@gmail.com**. Any other account is
refused (enforced both in the UI and in the Firestore rules).

From the dashboard you create an integration per betting platform:

| Field                  | Meaning                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **Slug**               | short operator id sent in the `x-operator` header, e.g. `mybet` |
| **Display name**       | label shown in the console                                  |
| **API secret**         | shared HMAC key — press ↻ to generate, copy it to the operator |
| **Wallet URL**         | the operator's HTTPS endpoint the game debits/credits        |
| **Currency**           | e.g. `UGX`                                                   |
| **Allowed origins**    | site origins permitted to embed the game                     |
| **Active**             | uncheck to instantly disable a platform                      |

Click the secret or launch URL in the list to copy it. Deleting an integration
immediately invalidates its tokens.

---

## 3. Integrating a betting platform

### 3.1 Create a launch session (server → server)

When a **logged-in** player clicks "Play Aviator", the platform backend calls:

```
POST https://<game-domain>/api/public/operator/launch
x-operator: mybet
x-signature: hex(HMAC_SHA256(api_secret, <raw request body>))
content-type: application/json

{ "player_id": "USER-123", "player_name": "john", "currency": "UGX", "ttl_seconds": 300 }
```

Response:

```json
{
  "token": "8f2c…",
  "expires_at": "2026-08-07T16:00:00Z",
  "launch_url": "https://<game-domain>/embed?token=8f2c…"
}
```

The token is single-use and short-lived, so a player who is not logged in on the
platform can never obtain one — that is what enforces "login required".

```js
import crypto from "node:crypto";

const body = JSON.stringify({ player_id: user.id, player_name: user.name, currency: "UGX" });
const signature = crypto.createHmac("sha256", API_SECRET).update(body).digest("hex");

const res = await fetch(`${GAME_URL}/api/public/operator/launch`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-operator": "mybet", "x-signature": signature },
  body,
});
const { launch_url } = await res.json();
```

### 3.2 Embed the iframe

```html
<iframe
  src="<launch_url>"
  allow="autoplay; fullscreen"
  style="width:100%;aspect-ratio:16/10;border:0;border-radius:12px"
  title="Aviator"
></iframe>
```

Mint a fresh `launch_url` on every page load (tokens expire). The frame posts
`{ type: "aviator:devtools-blocked" }` to the parent if a player tries to open
developer tools inside the game frame.

### 3.3 Implement the wallet endpoint

The game calls `wallet_url` server-to-server for every money movement:

```
POST <wallet_url>
x-operator: mybet
x-signature: hex(HMAC_SHA256(api_secret, <raw body>))

{ "action": "debit" | "credit" | "balance",
  "operator": "mybet",
  "player_id": "USER-123",
  "amount": 100,            // absent for "balance"
  "currency": "UGX",
  "reference": "<uuid>",    // idempotency key — never apply the same one twice
  "reason": "bet" | "payout" | …,
  "ts": 1754582400000 }
```

Always reply with the player's balance **after** applying the movement:

```json
{ "balance": 24500, "reference": "your-ledger-id" }
```

Rules:

1. **Verify the signature** before touching the ledger — recompute the HMAC over
   the raw body with your `api_secret` and compare.
2. **Be idempotent** on `reference`: if you have already applied it, return the
   current balance and do nothing.
3. Reject a `debit` with insufficient funds using HTTP 4xx — the game shows the
   error to the player.
4. Return `balance` as a plain number in the player's currency.

The game retries failed transfers on its next sync and records every transfer in
`wallet_transfers` with the same `reference`, so nothing is double spent and
nothing is lost.

### 3.4 What the player sees

* Balance in the game header is the platform balance (refreshed every few
  seconds and after every bet, cash-out and round settlement).
* Bets debit immediately; cash-outs and settlements credit back.
* No sign-out/registration UI is shown in embedded mode.

---

## 4. Deploying to Vercel

The app is a TanStack Start (Nitro) app; Vercel is auto-detected at build time.

1. Import the repository in Vercel — framework preset **Other**, build command
   `npm run build`, output handled by Nitro's Vercel preset.
2. Add the environment variable **`FIREBASE_SERVICE_ACCOUNT`** (the service
   account JSON) in *Project → Settings → Environment Variables*.
3. Add the Vercel domain to Firebase **Authorized domains**.

---

## 5. Going-live checklist

- [ ] Firestore rules published from `firestore.rules`.
- [ ] Email/Password + Google sign-in enabled; domains authorized.
- [ ] `FIREBASE_SERVICE_ACCOUNT` set in the deployment environment.
- [ ] Integration created in `/admin` with production wallet URL and origins.
- [ ] Launch endpoint called only for authenticated players.
- [ ] Wallet endpoint verifies signatures and is idempotent.
- [ ] Iframe served over HTTPS from the platform's logged-in area.
