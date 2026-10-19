/** Adapted from OpenGym frontend/src/lib/{onerm,progression,history}.js
 * Copyright (C) 2026 Duarte Santos. AGPL-3.0-or-later. See LICENSE and vendor/opengym.
 * AERON adaptation: typed sets, explicit warmups, conservative optional progression, no dataset/store dependency.
 */
import type { StrengthSet } from "./domain";
export function estimate1RM(weight: number, reps: number) {
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(reps) ||
    weight <= 0 ||
    reps < 1 ||
    reps > 12 ||
    !Number.isInteger(reps)
  )
    return null;
  return Math.round((reps === 1 ? weight : weight * (1 + reps / 30)) * 10) / 10;
}
export function supersetUnits(items: { superset?: string }[]) {
  const units: number[][] = [];
  items.forEach((e, i) => {
    if (i > 0 && e.superset && items[i - 1]?.superset === e.superset)
      units[units.length - 1].push(i);
    else units.push([i]);
  });
  return units;
}
export function setVolume(s: StrengthSet) {
  return s.done && s.mode !== "time" ? s.weight * s.reps : 0;
}
export function readStrengthSession(sets: StrengthSet[]) {
  const work = sets.filter((s) => s.kind !== "warmup");
  return {
    ok:
      work.length > 0 &&
      work.length >=
        Math.max(...work.map((s) => s.targetSetCount || work.length)) &&
      work.every(
        (s) =>
          s.done &&
          (s.mode === "time"
            ? (s.seconds || 0) >= (s.targetSeconds || s.seconds || 0)
            : s.reps >= (s.targetReps || s.reps)),
      ),
    weight: Math.max(0, ...work.filter((s) => s.done).map((s) => s.weight)),
    low: Math.min(...work.map((s) => (s.done ? s.reps : 0))),
    seconds: Math.min(...work.map((s) => (s.done ? s.seconds || 0 : 0))),
  };
}
export type Progression = "off" | "linear" | "double" | "time";
export function nextPrescription(
  history: StrengthSet[][],
  cfg: {
    policy: Progression;
    reps: number;
    minReps: number;
    weight: number;
    seconds: number;
    increment: number;
  },
) {
  const sessions = history.map(readStrengthSession);
  const last = sessions.at(-1);
  const base = {
    weight:
      cfg.policy === "off" && cfg.weight > 0
        ? cfg.weight
        : (last?.weight ?? cfg.weight),
    reps: cfg.reps,
    seconds: cfg.seconds,
  };
  if (!last || cfg.policy === "off")
    return {
      ...base,
      kind: "hold",
      reason: last
        ? "Previous recorded load. Automatic progression is off."
        : "No recorded performance. Choose a comfortable baseline.",
    };
  let stalls = 0;
  for (let i = sessions.length - 1; i >= 0 && !sessions[i].ok; i--) stalls++;
  if (stalls >= 3) {
    const step = cfg.increment;
    const weight = Math.max(
      0,
      Math.min(
        base.weight - step,
        Math.round((base.weight * 0.9) / step) * step,
      ),
    );
    return {
      ...base,
      weight: Math.max(0, weight),
      kind: "deload",
      reason:
        "Three incomplete prescriptions. Reduce load and rebuild with good form.",
    };
  }
  if (cfg.policy === "time")
    return {
      ...base,
      seconds: last.ok ? cfg.seconds + 5 : cfg.seconds,
      kind: last.ok ? "up" : "hold",
      reason: last.ok
        ? "Every hold reached the target. Add 5 seconds."
        : "Keep the target until all holds are completed.",
    };
  if (!last.ok)
    return {
      ...base,
      reps:
        cfg.policy === "double"
          ? Math.max(cfg.minReps, Math.min(cfg.reps, last.low + 1))
          : cfg.reps,
      kind: "hold",
      reason: "The previous prescription was incomplete. Keep the load.",
    };
  if (base.weight === 0)
    return {
      ...base,
      reps: cfg.reps + 1,
      kind: "up",
      reason: "Bodyweight work: add a repetition, not external load.",
    };
  return {
    ...base,
    weight: Math.round((base.weight + cfg.increment) * 10) / 10,
    reps: cfg.policy === "double" ? cfg.minReps : cfg.reps,
    kind: "up",
    reason:
      "All working sets met their targets. A small load increase is available.",
  };
}
