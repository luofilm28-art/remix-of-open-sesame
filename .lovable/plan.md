Nova Launch — rebrand & reskin

## Goal
Distinguish the remixed crash game from the original Aviator clone by giving it a cohesive space-launch theme: a rocket climbing through deep space, a new color identity, sci-fi typography, and updated copy.

## What changes

### Visual identity
- Rename in-app title from "Aviator" to "Nova Launch".
- Replace the propeller plane with a stylized rocket sprite.
- Replace cloud background with a star-field / nebula background.
- New palette: deep space navy/purple background, cyan energy trail, amber/orange cash-out accents.
- New fonts: Space Grotesk for headings, Rajdhani for numeric and HUD text.

### Components to update
- `src/styles.css`: new color tokens, gradients, shadows, font imports, utilities.
- `src/components/game/PlaneSprite.tsx` → `RocketSprite.tsx` (or rename and repurpose) with a rocket image and engine flame instead of propeller.
- `src/components/game/GameCanvas.tsx`: switch trail colors to cyan/purple/amber tiers, use star background, adjust plane positioning math for rocket aspect ratio.
- `src/components/game/TopBar.tsx`: show "Nova Launch" branding, swap plane logo for rocket.
- `src/components/game/LoadingScreen.tsx`: flying rocket animation instead of plane.
- `src/routes/__root.tsx` and `src/routes/index.tsx`: update title and meta descriptions.
- `src/routes/auth.tsx` (if present): update any Aviator-branded copy.

### Assets
- Generate `src/assets/rocket.png` (transparent rocket facing right).
- Generate `src/assets/stars.png` (seamless star field / nebula strip).
- Keep `public/favicon.png` reference; if a simple generated icon is needed, create `public/favicon.png`.

### Copy updates
- "Flew away" → "Lost signal" / "Rocket escaped".
- "credits" → "credits" stays, keep generic.
- "Provably fair" text stays.
- Round counter text stays.

## Technical approach
- Keep all design-token values in `src/styles.css`; do not hardcode colors in components.
- Use the existing semantic token names (`primary`, `success`, `accent`, etc.) so components remain theme-agnostic.
- Generate new artwork via the image generator; import as ES6 modules.
- Verify the build and preview still load the game loop correctly after asset swaps.
