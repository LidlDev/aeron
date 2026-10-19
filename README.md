# AERON — Train with intent.

A React + TypeScript endurance training prototype. Demo mode works without an account, API key, or backend. All user data stays in the current browser's localStorage.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The dev server listens on all interfaces. On a phone on the same network as your computer, use your computer's LAN IP with port 3000. A remote workspace needs port forwarding; your phone's localhost does not point to that workspace.

## GitHub Pages

The included `.github/workflows/pages.yml` runs domain tests, checks TypeScript, builds Vite, and deploys `dist` using GitHub Pages. Set **Settings → Pages → Source → GitHub Actions**. Every push to `main` rebuilds and redeploys. Relative asset URLs and hash routing support repository subpaths.

## Features

- Dashboard, weekly/monthly calendar, drag-and-drop rescheduling and mobile move controls
- Eleven-step onboarding, conservative four-week planning, preserved completed history
- 60 structured workout records, 30 detailed exercise records, interval editor and workout timer
- Running, cycling, swimming studios and strength set logging
- Configurable fueling plans, nutrition journal, recovery check-ins
- Twelve-week seeded history and responsive Recharts analytics
- Rule-based Demo Coach with review, accept, reject and undo
- Garmin structured JSON export and manual setup guide; deduplicated Strava demo import
- Editable SVG brand assets, procedural R3F scenes, reduced motion and WebGL fallbacks
- Validated versioned data import/export, reset, settings and error boundaries

## Data and integration boundaries

All demonstration history is fictional. Garmin and Strava do not connect to real accounts. JSON exports are AERON definitions, **not Garmin FIT files**. The Demo Coach is deterministic software, not a connected generative AI model. The `CoachAdapter` interface is intended for a future authenticated server endpoint. Never add private tokens or API keys to frontend code.

Data is browser-local: Pages and localhost have separate storage, as do different phones and computers. Use Settings → Data to export/import a backup between them. Clearing browser data removes local records. A public Pages URL serves application code and fictional seed data; locally entered training data is not pushed to GitHub.

Nutrition ranges are educational and configurable. Recovery scales are subjective check-ins, not a medical score.

## Verification

```sh
npm test
npm run build
```

The automated domain tests cover library completeness, plan volume safety, history preservation, accurate intervals and swim distance, completion, coach acceptance/undo, Strava deduplication, and backup validation.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn-style Button with Radix Slot and CVA, Radix accessible dialogs, React Three Fiber, Drei, Three.js, Framer Motion, Recharts, Lucide, Vitest.
