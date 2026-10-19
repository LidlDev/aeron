# AERON V2 architecture

AERON remains a browser-local React/TypeScript application, built with Vite, deployed by GitHub Actions to GitHub Pages. Hash routing and relative assets support `/aeron/` and localhost. No production backend or external account authorization is implied.

## Canonical records

`src/domain.ts` owns the public entity types, deterministic demo seed, workout calculations, four-week planning, activity import, coach transitions, and storage facade. `Database.version` is now 2. Existing entity IDs and original workouts are preserved.

`PlannedSession.id` is the common lifecycle identity. `CompletedActivity.sessionId` relates an actual activity to the schedule. `StrengthLog.sessionId` uses that **same** ID. A strength template (`StrengthWorkout`) contains ordered `StrengthExercise` entries; each occurrence has its own ID, so repeated exercises and substitutions never accidentally merge. Sets persist targets separately from actual reps/time, warmup/working type, RPE/RIR, rest, load, and optional superset labels. Completed sets and finished logs remain historical facts.

`strength-core.ts` implements start, update, substitution, history, catalogue loading, and idempotent finish. Finishing records entered duration and effort, completes the canonical session, and updates the activity used by dashboard, analytics, adherence and coach. Recorded session minutes are explicitly editable; the software does not claim a default template duration was measured by a wearable.

## Migration and recovery

`migrations.ts` accepts V1 and V2 data, adds templates/metadata, links old isolated strength logs to their original activity/session or creates a recoverable canonical session, and removes dangling historical plan references. It never invents replacement activity IDs for already recorded activities. V2 migration is idempotent.

Storage reads `aeron.database.v2`, falling back to `aeron.database.v1`. On the first subsequent save, the untouched legacy JSON is retained under `aeron.database.v1.backup`; the original V1 key also remains. Invalid or unsupported data opens a clearly labeled temporary demo **with persistence blocked**. Download original, validated import, or confirmed replacement is available. Explicit recovery replacement saves the original raw value as `aeron.recovery.backup`. No silent persistent reset is performed. Data backup import also migrates V1.

A saved V1 snapshot generated from commit `7ed347d` is committed under `scripts/fixtures/` and exercised by browser migration tests. It contains fictional seed data only.

## Training integrity

Availability is a ceiling. Four-week budgets use baseline × [1, 1.05, 1.10, .80], capped by availability. Generated actual durations are stored separately from capacity budgets. Pool distances round down to pool-length multiples while retaining estimated pacing. Strength defaults to A/B with sensible duration within capacity, avoids a day immediately before configured long sessions where alternatives exist, and spaces sessions when possible. Limited availability and single-session days are honored. Missed sessions never accumulate catch-up debt.

Completed sessions, active strength drafts and `coachProtected` approved sessions survive regeneration. Calendar deletion archives completed strength sessions while retaining their canonical identity for logs and activities; deleting an active draft is blocked until it is finished or explicitly discarded. Candidates colliding with those preserved date/discipline slots are omitted. Coach undo restores the exact prior session snapshot. Stale or completed session changes cannot be approved; independently edited applied sessions cannot be blindly reverted.

`metrics.ts` derives summaries from canonical activities and session definitions. Dashboard, decision center and analytics use these selectors rather than unrelated counters. Activity imports normalize minutes, kilometers and watts, deduplicate stable provider IDs, and match uncompleted sessions by date/sport/duration. Unmatched imports get a canonical completed session. Matching is heuristic and is not verified device synchronization.

## Coach revisions

Demo Coach is deterministic. Each recommendation records a trigger, supporting data, proposed definition, reason, expected effect and uncertainty. State is Proposed → validation against the current session → Approved/Rejected → Applied → Reverted. Approval creates validation and approval events before the applied event. Application and revert are explicit user actions, and never mutate completed activity history. Legacy recommendations remain readable.

## Sport experiences and analytics

`workout-math.ts` expands repeated intervals and explicit recoveries. Profiles and duration totals share this arithmetic. Cycling resolves FTP percentages to configured watts, running emphasizes effort/work-rest targets, and swimming shows distance sets with pool validation. Swim execution records explicit set/rep completion; legacy checkmarks are not interpreted as completed sets.

Analytics filters support global and per-sport views. Pace/power appear only when recorded. Prescribed zone time is labeled as derived from definitions; it is not a measured power trace. FTP history records actual configuration changes. Strength estimated 1RM is bounded to loaded rep sets of 1–12 reps and is clearly labeled as an estimate. Recovery is subjective, and session load is descriptive minutes × RPE, not a medical prediction.

## Performance and accessibility

Recharts, R3F scenes and the large text-only catalogue load in separate chunks. Catalogue results are paginated. The 1,316-row import chunk is about 137 KB gzipped; persisted catalogue text increases local backup size. Existing fonts remain self-hosted with their OFL notices. Three.js caps DPR, suspends offscreen/hidden animation, listens to system reduced motion and provides a non-WebGL fallback. Timers use deadlines rather than decrementing ticks; active strength data survives reload. Radix dialogs trap focus and scroll; explicit form labels, safe-area navigation, keyboard focus and touch-sized logging controls are retained.

## Future adapters

Keep secrets off the frontend. Real AI, Garmin authorization/FIT transfer, Strava OAuth/token refresh/webhooks, and multi-device storage require separately implemented secure services. Existing `CoachAdapter` and typed normalized records remain extension points; no OpenGym API is imported. A Supabase or other backend can replace the storage facade after account/data migration is designed.
