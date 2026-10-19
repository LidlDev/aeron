# OpenGym integration audit and map

Reference checkout: `/workspace/opengym-reference` (separate Git repository; not merged).
Upstream: https://github.com/alexpcosta/opengym
Audited revision: `678bf5bf10446e8997a77d43e89c9b2721d8d0fc`.

## Observed implementation

OpenGym uses React 19, Vite, Zustand and a Node HTTP API. `frontend/src/store/useStore.js` persists `gym_state_v1` locally, optionally synchronizes JSON state to its authenticated API, and mirrors mobile state with Capacitor. AERON will retain its existing typed normalized state and will not import this backend, credentials, bodyweight requirements, Capacitor, or UI.

| Upstream source | Implemented behavior | AERON integration |
|---|---|---|
| `frontend/src/lib/exercises-data.js` | 1,324 records, 1,324 unique string IDs; `id,n,bp,eq,tg,mg,sm,st,img,gif` | Text-only typed adapter, stable `og:` IDs, explicit aliases for existing records, normalized duplicate handling |
| `frontend/src/lib/onerm.js` | Finite-input validation, 12-rep cap, Epley/Brzycki/Lombardi estimates, best completed set | Typed bounded estimate; retain measured load/reps separately |
| `frontend/src/lib/progression.js` | Reads actual completed sets against targets; linear, double, time, Greyskull rules; deload after failures | Selective typed adaptation of conservative linear/double/time rules; no mandatory progression or failure/AMRAP prescription |
| `frontend/src/lib/history.js` | Previous entry, completed-set records, timed/reps modes, adjacent superset groups | Adapt superset grouping; canonical AERON log/history adapter |
| `frontend/src/store/useUI.js`, `components/RestTimer.jsx` | Deadline-based rest/work timers, visibility reconciliation | Deadline-based AERON timer; omit network push, sounds and global Zustand store |
| `frontend/src/views/Workout.jsx` | Editable sets, substitutions, previous values, active exercise navigation, finish history | AERON-specific builder/execution with canonical session identity |

## Licensing decision

`NOTICE.md` identifies OpenGym copyright (C) 2026 Duarte Santos. Its package metadata says AGPL-3.0-or-later, and LICENSE contains AGPL v3. The adapted application is distributed under AGPL-3.0-or-later with upstream copyright and a complete license. No new upstream runtime dependency is introduced by these ports. Existing AERON packages retain their own permissive license notices; fonts retain their OFL notices. Corresponding source, build instructions, lockfile, and modifications are published in https://github.com/LidlDev/aeron. The UI links to source and licensing to provide a visible source offer for network use. This source offer and notices must be retained by downstream deployments; modified network versions must offer their corresponding source under applicable AGPL terms.

Exercise source: https://github.com/hasaneyldrm/exercises-dataset at `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`, as pinned by OpenGym. The actual LICENSE was inspected: MIT applies to code, tooling, structure and instruction text/translations, copyright (c) 2026 Hasan Emir Yıldırım. Its explicit MEDIA EXCEPTION excludes `images/` and `videos/`, copyright Gym Visual, and requires independently obtained rights. AERON copies **no media, media URLs, body diagram paths, AI CLI, or provider code**. Exercise views use text and original SVG fallbacks. Do not enable image URLs from the original records without a separate rights review.

The catalogue does not assert upstream difficulty, unilateral or compound metadata exists. AERON's movement/stance classifications are heuristic or curated and are labeled as such. Original AERON IDs are retained when mapped; aliases record upstream IDs. The import script records counts and deduplication. See the committed data/provenance files and `vendor/opengym/` for exact notices and adapted modules.

## Baseline overlap and gaps

AERON already had 60 structured workouts, 30 exercises, editable interval steps, a basic strength logger, timer, local persistence, charts, demo coach, JSON export and demo activity import. All seven Vitest tests and `npm run build` passed before changes. No lint script existed. Important observed gaps: strength logs create isolated activities; generation overwrites approved changes; no actual schema migration; exercise search has no categorical filters; all sports share the same duration-only timeline; mobile calendar repeats oversized day cards. These are being corrected without removing nutrition, recovery, onboarding, exports, or demo imports.

## Delivered catalogue and adapted modules

The text import is reproducible with `node scripts/import-opengym.mjs /path/to/opengym-reference`. It reads JSON rather than executing upstream application code. The committed `src/data/opengym-catalogue.json` contains **1,316** normalized records from 1,324 upstream rows (8 name/equipment duplicates merged). `opengym-id-map.json` maps every original ID, and `opengym-provenance.json` records commits and aliases. Sixteen mapped records retain AERON `ex-*` IDs and original curated instructions. Combined with the remaining 14 AERON-only records, the searchable catalogue contains **1,330** exercises. Difficulty absent from the source is explicitly “Not specified.” No media field is retained by the adapter.

`src/strength-engine.ts` is the selective typed code adaptation of OpenGym's `onerm.js` (`estimate1RM` rep cap/Epley validation), `history.js` (`supersetUnits`), and `progression.js` (prescription success, stall/deload and linear/double/time policies). Fields are adapted to `StrengthSet` and warmups are excluded; target set counts prevent removed/incomplete prescriptions from earning a load increase. AERON's default progression is manual/previous load, not automatic mandatory increases. Greyskull/AMRAP logic is not ported. `strength-core.ts` provides original AERON lifecycle/history adapters and `Strength.tsx` supplies a new AERON UI. Deadline timers follow the inspected upstream pattern but do not import its Zustand, notification, API or UI modules.

The lockfile's declared license metadata was inspected. Runtime dependencies predominantly use MIT/ISC/BSD/Apache terms. MPL-2.0 entries are Lightning CSS build tooling/native variants; CC-BY-4.0 is caniuse-lite browser-support data. `webgl-constants` lacks a package license field, but its included LICENSE was inspected and is MIT (2019 Tim van Scherpenzeel). No OpenGym dependency is added by the code ports. `scripts/build-notices.mjs` collects installed package license/notice texts, exercise text attribution, upstream attribution and OFL font notices into the deployed `third-party-notices.txt`; the AGPL text is deployed as `license.txt`. This is a scoped provenance review, not a claim that third-party media rights transfer with OpenGym.
