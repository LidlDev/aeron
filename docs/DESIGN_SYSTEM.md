# AERON V2 design system

AERON keeps its editable SVG symbol/wordmark, obsidian background `#080B0D`, graphite surfaces `#101518` / `#171D20`, borders `#293237`, foreground `#F3F5EF`, secondary text `#9BA8AD`, and volt accent `#D6FF43`. Discipline colors remain running coral `#FF875B`, cycling volt, swimming cyan `#43C7E8`, strength violet `#A68CFF`, nutrition amber `#F2C66D`, recovery mint `#72D9AF`.

Space Grotesk supplies headings and metrics, Inter supplies UI text, and IBM Plex Mono supplies dates, intervals and technical labels. Fonts are local and retain their licenses. Daily product page headings are about 27–31px; the editorial onboarding welcome is the deliberate exception.

## Layout and reusable components

- `ui.tsx`: compact PageTitle, Field with explicit associated labels, SectionTitle, Card, Badge, Stat, Empty, Radix Modal, scene loading/fallback and error boundaries.
- `components/ui/button.tsx`: shadcn-style Radix Slot/CVA button with consistent primary/outline/ghost/danger states.
- `SessionRow.tsx`: shared date/discipline/duration/distance/intensity/status row with accessible quick completion and contextual edit/move/duplicate/skip/delete actions.
- `IntervalTimeline.tsx`: running work/recovery chart, cycling FTP power profile, swimming distance-set lanes, strength structure summary.
- `Strength.tsx`: paginated exercise rows, instructional drawer, expandable template entries, set controls and deadline timers. Working and warm-up sets are distinct.
- `Coach.tsx`: assessment, evidence, current/proposed comparison, approval controls and revision history. Chat is secondary.
- `Charts.tsx`: responsive chart primitives with labels, units, tooltips, legends and non-fabricated empty states. Analytics supplies date/source context.

Original styles remain in `styles.css`; `v2.css` is a focused V2 composition layer. Spacing follows an 8px rhythm with smaller 4px subdivisions for dense controls. Cards use 8–12px radii and thin borders. Do not wrap every metric in nested cards or duplicate sport badges around the same information.

## Mobile priorities

The first home viewport shows greeting/date/phase, today’s instruction, weekly completed/planned hours, readiness and the next key session. The sculpture occupies a compact brand slot. The calendar uses a horizontal seven-day selector and compact day/week agenda, not seven tall day cards. Global navigation uses five bottom destinations plus a drawer. Contextual actions use reachable menus. Important logging controls are about 40–44px; tables avoid horizontal page overflow, and modal content scrolls independently.

Page-header actions become compact icon controls on phones while retaining accessible names. The mobile shell includes an AERON wordmark. No essential action depends on hovering. Focus-visible outlines, explicit labels, reduced-motion settings, source links and WebGL fallbacks are part of the component contract.

## Motion and 3D

Use the three-band sculpture sparingly: compact dashboard identity and onboarding. Terrain is opt-in in analytics; race journey and recovery visualization retain meaningful contexts. No unrelated object is attached to each sport page. Honor both OS and in-app reduced motion, stop invisible/hidden render loops, and preserve the same information without WebGL.
