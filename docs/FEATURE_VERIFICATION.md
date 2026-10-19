# AERON V2 verification

## Baseline (before application changes)

- Audited AERON commit `7ed347d` and separate OpenGym checkout `678bf5bf10446e8997a77d43e89c9b2721d8d0fc`.
- `npm test`: **7 / 7 passed**.
- `npm run build`: **passed**.
- Existing `scripts/browser-smoke.py`: **passed**, using the pre-V2 production build at 390 × 844.
- No existing lint command was present. V2 adds ESLint and an explicit type-check command.

## V2 checks

Commands executed against the working checkout:

| Check | Result |
|---|---|
| `npm run lint` | Passed, zero warnings/errors |
| `npm run typecheck` | Passed |
| `npm test` | 25 tests across domain and V2 regression suites |
| `npm run build` | Passed, static production artifact in `dist/` |
| `python scripts/browser-smoke.py` | Passed against built app, 390 × 844 |
| `python scripts/v2-journeys.py` | Passed against built app, 390 × 844 and 1440 × 1000 |
| Browser errors / overflow | No uncaught or console errors in tested journeys; no page overflow in tested core views |

The production build reports a size advisory for the **lazy** exercise catalogue chunk (about 1.78 MB uncompressed / 137 KB gzip). It is not in the initial application chunk, and catalogue results are paginated. This is a known optimization opportunity, not a claim that payload size is zero.

## Domain regression coverage

- Baseline-calibrated four-week budgets, availability ceiling, rolling base without a race countdown, rest days, single-session days, default A/B strength placement, recovery week, no catch-up debt.
- Actual plan durations and pool-length rounding, exact 60-minute threshold structure, exact 2,400m source swim, interval profile/rest totals.
- Completed and approved sessions surviving plan regeneration, snapshot validation, stale proposal rejection, approval/revert events and exact undo.
- Canonical strength start/log/finish, idempotent completion, editable set validation, substitutions with separate occurrence IDs, completed-set protection; archive guards preserve canonical history and active drafts on deletion/regeneration.
- Incomplete/removed set prescriptions not advancing load, optional progression, manual configured load, bounded estimated 1RM, timed-set volume exclusion and superset grouping.
- OpenGym text import count, aliases, unique normalized records, no retained media fields.
- V1 migration preserving identities and activities, idempotent migration, original backup, blocked corrupt-data overwrites and explicit recovery replacement.
- Import normalization, stable-ID deduplication, date/sport/duration matching, unmatched-import adherence semantics, dashboard/activity consistency.

## Exercised browser journeys

| Journey | Actual browser actions |
|---|---|
| A — Plan and train | Eleven-step onboarding, baseline input, generate block, calendar, running detail, edit/save, completion and analytics |
| B — Strength | Load/search OpenGym text catalogue, read instructions, build template using imported exercise, editable sets/reps/weight/rest, start, pause/reload/resume, complete, view exercise history |
| B — Scheduled strength | Start an existing scheduled session, substitute an exercise, navigate exercises, finish, confirm original calendar identity completed |
| C — Adaptation | Record fatigue, request review, inspect proposed change, approve, calendar references change, undo restores prior reference |
| D — Customization | Edit running/cycling intervals, save, verify duration/targets, export real structured JSON with manual Garmin instructions |
| E — Import | Demo import, repeat import without duplicates; UI-scheduled ride matched to a demo import and completed; matching/normalization also tested at domain level |
| F — Persistence | Persist settings/workouts, reload; real V1 JSON snapshot from baseline commit migrates, retains history, backs up and survives reload |
| Sports | Running effort profile, cycling power profile, swim lanes and explicit swimming set/rep execution progress |
| Analytics | Overview and each discipline tab, desktop/mobile core routes without horizontal overflow |
| Accessibility/performance | Reduced-motion navigation, real WebGL-unavailable fallback, labeled controls, scrollable dialogs |

These are scripted Chromium checks, not a claim of manual testing on physical iPhones, Android devices, watches, smart trainers or every browser. No real Garmin or Strava service or medically validated recovery model was tested.

## Remaining limitations / next steps

- Real Strava OAuth, secure token storage/webhooks, Garmin authorization, validated FIT serialization and device transfer remain future backend work. Current import is explicitly demo; export is JSON/manual.
- Demo Coach remains deterministic and describes uncertainty. Provider-backed AI needs a secure validated server adapter.
- No Gym Visual media rights are included; exercise text and original SVG/icon fallbacks are used.
- Movement/stance/compound metadata is inferred or curated; upstream has no supplied difficulty field. Corrections and richer expert review are appropriate follow-up work.
- FTP history records configured changes, not laboratory measurements. Prescribed time-in-zone is not a measured power trace. Legacy swim activities lack per-set completion data.
- Browser-local storage has finite quota and separate data per device/origin. Use backup export; multi-device sync requires a backend migration.
- Heavier catalogue/font payloads can be optimized further. No claims of lab-measured mobile performance or broad assistive-technology certification are made.
