# AERON V2 — Train with intent.

**[Open AERON](https://lidldev.github.io/aeron/)** · [Deployment workflow](https://github.com/LidlDev/aeron/actions)

A browser-local endurance training platform for triathletes. React, TypeScript, Vite, Tailwind, Radix/shadcn-style primitives, React Three Fiber/Drei, Framer Motion, Recharts and Lucide. Demo mode works without accounts or API keys.

## Run locally

Requires Node 22.13+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a phone on your computer’s network, use that computer’s LAN IP and port 3000. A remote workspace requires port forwarding; the GitHub Pages URL works directly on mobile.

## What changed in V2

- Training-first compact dashboard and horizontal mobile calendar with contextual session actions.
- 1,330 searchable exercises: 1,316 normalized OpenGym-derived text records, including 16 aliases preserving original AERON IDs, plus 14 AERON-only records. Images are deliberately excluded by separate media licensing.
- Ordered strength builder, saved templates, working/warm-up sets, reps/load/RPE/RIR, timed holds, supersets, substitutions, deadline rest timer, previous performance and bounded estimated records.
- One canonical calendar lifecycle for strength and endurance, with history-safe migration and plan regeneration.
- Sport-specific profiles, swim pool validation and explicitly logged swim set progress.
- Sport-specific analytics and evidence-led Demo Coach with validated approvals and reversible revisions.

## Data and integrations

V1 browser data migrates to schema V2 with an untouched original and backup. Invalid data cannot be silently overwritten. Settings → Data provides validated backup import/export and explicit reset/recovery. Entered data remains in this browser and is not pushed to GitHub. Pages, localhost and different devices use separate storage.

All demonstration history is fictional. Strava import is **Demo Import**, not OAuth. Garmin export is structured **AERON JSON**, not a FIT file or verified synchronization. The coach uses deterministic rules. No frontend API secrets are used. Real integrations need secure server-side adapters.

## Verification and deployment

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Optional browser tests require Python Playwright and Chromium. Serve `dist` on port 3001, then run:

```sh
AERON_URL=http://localhost:3001 python scripts/browser-smoke.py
AERON_URL=http://localhost:3001 python scripts/v2-journeys.py
```

`CHROMIUM_PATH` selects a system browser; set it to an empty string to use Playwright’s installed Chromium. GitHub Actions installs the tools and runs both browser suites before deploying `main` to Pages. Keep Pages → Source set to GitHub Actions.

## Documentation

- [Architecture and storage migration](docs/AERON_V2_ARCHITECTURE.md)
- [OpenGym sources, adaptations and licensing](docs/OPENGYM_INTEGRATION.md)
- [Design system and mobile behavior](docs/DESIGN_SYSTEM.md)
- [Feature verification and remaining limitations](docs/FEATURE_VERIFICATION.md)

## Source and licensing

AERON V2 includes selective OpenGym code adaptations, copyright (C) 2026 Duarte Santos, under **AGPL-3.0-or-later**. Corresponding application source is this repository; see [LICENSE](LICENSE). Retain attribution and offer corresponding source for modified network deployments as required by the applicable license.

Exercise metadata/instruction text originates from Hasan Emir Yıldırım’s exercises-dataset under MIT with an explicit media exception. No Gym Visual images or animations are included. See `vendor/opengym/`, the integration document, and per-module attribution. Fonts retain OFL notices. Builds produce [third-party notices](https://lidldev.github.io/aeron/third-party-notices.txt) and [license text](https://lidldev.github.io/aeron/license.txt).

To reproduce the text catalogue import from the separately checked-out audited OpenGym revision:

```sh
node scripts/import-opengym.mjs /path/to/opengym-reference
```
