import {
  uid,
  today,
  duration,
  completeSession,
  type Database,
  type Exercise,
  type StrengthSet,
  type StrengthWorkout,
  type StrengthExercise,
} from "./domain";
import { estimate1RM, nextPrescription, setVolume } from "./strength-engine";
export function defaultEntry(exerciseId: string, index = 0): StrengthExercise {
  return {
    id: uid(),
    exerciseId,
    sets: 3,
    reps: 8,
    minReps: 6,
    weight: 0,
    seconds: 30,
    mode: ["ex-20", "ex-22", "ex-21"].includes(exerciseId) ? "time" : "reps",
    restSeconds: 90,
    warmupSets: index === 0 ? 1 : 0,
    rpe: 7,
    rir: 3,
    progression: "off",
    increment: 2.5,
    superset: "",
  };
}
export function defaultStrengthWorkouts(): Record<string, StrengthWorkout> {
  return {
    A: {
      id: "A",
      name: "Strength A — Lower Body + Core",
      minutes: 45,
      notes:
        "Controlled squat and hinge patterns, unilateral stability, calf strength and trunk control. Keep 2–3 reps in reserve.",
      entries: ["ex-2", "ex-3", "ex-5", "ex-10", "ex-19", "ex-20"].map(
        (id, i) => ({ ...defaultEntry(id, i), id: `A-${i}` }),
      ),
    },
    B: {
      id: "B",
      name: "Strength B — Full Body + Resilience",
      minutes: 45,
      notes:
        "Upper-body push/pull, hip stability, posterior chain and shoulder control. Finish with consistent technique.",
      entries: ["ex-13", "ex-14", "ex-9", "ex-24", "ex-18", "ex-25"].map(
        (id, i) => ({ ...defaultEntry(id, i), id: `B-${i}` }),
      ),
    },
  };
}
export function annotateExercise(e: Exercise): Exercise {
  return {
    ...e,
    unilateral:
      e.unilateral ??
      /single|one-|split|lunge|step-up|side plank|bird dog|pallof/i.test(
        e.name,
      ),
    compound:
      e.compound ??
      ["Squat", "Hinge", "Lunge", "Push", "Pull"].includes(e.category),
    origin: e.origin || "AERON",
    classification: e.classification || "AERON curated",
  };
}
export async function loadCatalogue(db: Database) {
  const { default: rows } = await import("./data/opengym-catalogue.json");
  const exercises = { ...db.exercises };
  for (const row of rows) {
    const incoming = row as Exercise;
    exercises[incoming.id] = exercises[incoming.id]
      ? {
          ...incoming,
          ...exercises[incoming.id],
          upstreamIds: incoming.upstreamIds,
          origin: "AERON + OpenGym",
          source: incoming.source,
        }
      : incoming;
  }
  return { ...db, exercises };
}
export function exerciseHistory(db: Database, exerciseId: string) {
  return Object.values(db.strengthLogs)
    .filter(
      (l) =>
        l.completed &&
        l.sets.some((s) => s.exerciseId === exerciseId && s.done),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => {
      const sets = l.sets.filter(
        (s) => s.exerciseId === exerciseId && s.done && s.kind !== "warmup",
      );
      return {
        id: l.id,
        date: l.date,
        sets,
        volume: sets.reduce((n, s) => n + setVolume(s), 0),
        weight: Math.max(0, ...sets.map((s) => s.weight)),
        reps: Math.max(0, ...sets.map((s) => s.reps)),
        estimated1RM: Math.max(
          0,
          ...sets
            .filter((s) => s.mode !== "time")
            .map((s) => estimate1RM(s.weight, s.reps) || 0),
        ),
      };
    });
}
export function prescriptionFor(db: Database, entry: StrengthExercise) {
  return nextPrescription(
    Object.values(db.strengthLogs)
      .filter(
        (l) =>
          l.completed && l.sets.some((s) => s.exerciseId === entry.exerciseId),
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) =>
        l.sets.filter(
          (s) => s.exerciseId === entry.exerciseId && s.kind !== "warmup",
        ),
      ),
    {
      policy: entry.progression,
      reps: entry.reps,
      minReps: entry.minReps,
      weight: entry.weight,
      seconds: entry.seconds,
      increment: entry.increment,
    },
  );
}
export function startStrength(
  db: Database,
  templateId: string,
  sessionId?: string,
): { db: Database; logId: string } {
  const t = db.strengthWorkouts[templateId];
  if (!t || !t.entries.length)
    throw new Error("Choose a template with at least one exercise.");
  for (const e of t.entries)
    if (!db.exercises[e.exerciseId])
      throw new Error(
        "A template exercise is missing. Substitute it before starting.",
      );
  if (
    sessionId &&
    (!db.sessions[sessionId] ||
      db.workouts[db.sessions[sessionId].workoutId].sport !== "Strength")
  )
    throw new Error("Choose a strength session.");
  if (sessionId && db.sessions[sessionId].status === "completed")
    throw new Error("This session is already complete.");
  const active = Object.values(db.strengthLogs).find((l) => !l.completed);
  if (active) return { db, logId: active.id };
  const next = structuredClone(db);
  const sid = sessionId || uid();
  if (!sessionId) {
    const wid = uid();
    next.workouts[wid] = {
      ...next.workouts["strength-0"],
      id: wid,
      title: t.name,
      strengthTemplateId: templateId,
      steps: [
        {
          id: uid(),
          name: "Strength session",
          minutes: t.minutes,
          reps: 1,
          rest: 0,
          distance: 0,
          zone: 2,
          target: "Controlled strength · RPE 6–7",
        },
      ],
      notes: t.notes,
    };
    next.sessions[sid] = {
      id: sid,
      workoutId: wid,
      date: today(),
      status: "planned",
      notes: t.notes,
    };
  }
  const id = uid();
  const sets = t.entries.flatMap((entry) => {
    const p = prescriptionFor(db, entry);
    return Array.from(
      { length: entry.sets + entry.warmupSets },
      (_, i): StrengthSet => ({
        id: uid(),
        sessionId: sid,
        entryId: entry.id,
        exerciseId: entry.exerciseId,
        reps: p.reps,
        weight: i < entry.warmupSets ? p.weight * 0.5 : p.weight,
        rpe: entry.rpe,
        rir: entry.rir,
        done: false,
        kind: i < entry.warmupSets ? "warmup" : "working",
        restSeconds: entry.restSeconds,
        mode: entry.mode,
        seconds: p.seconds,
        targetReps: p.reps,
        targetSetCount: entry.sets,
        targetSeconds: p.seconds,
        superset: entry.superset,
      }),
    );
  });
  next.strengthLogs[id] = {
    id,
    date: next.sessions[sid].date,
    sessionId: sid,
    template: templateId,
    sets,
    notes: t.notes,
    completed: false,
    minutes: sessionId
      ? duration(next.workouts[next.sessions[sid].workoutId])
      : t.minutes,
    activeEntryId: t.entries[0].id,
    startedAt: Date.now(),
    elapsedSeconds: 0,
    paused: false,
  };
  return { db: next, logId: id };
}
export function updateStrengthSet(
  db: Database,
  logId: string,
  setId: string,
  patch: Partial<StrengthSet>,
) {
  const log = db.strengthLogs[logId];
  if (!log || log.completed) throw new Error("This log is not editable.");
  const current = log.sets.find((s) => s.id === setId);
  if (!current) throw new Error("Set not found.");
  const s = { ...current, ...patch };
  if (
    !Number.isFinite(s.weight) ||
    s.weight < 0 ||
    s.weight > 1000 ||
    !Number.isInteger(s.reps) ||
    s.reps < 0 ||
    s.reps > 1000 ||
    s.rpe < 1 ||
    s.rpe > 10 ||
    !Number.isFinite(s.rpe) ||
    (s.rir != null && (s.rir < 0 || s.rir > 10)) ||
    (s.seconds != null && (!Number.isFinite(s.seconds) || s.seconds < 0)) ||
    (s.restSeconds != null &&
      (!Number.isFinite(s.restSeconds) || s.restSeconds < 0))
  )
    throw new Error("Use valid reps, load, effort and time values.");
  return {
    ...db,
    strengthLogs: {
      ...db.strengthLogs,
      [logId]: { ...log, sets: log.sets.map((x) => (x.id === setId ? s : x)) },
    },
  };
}
export function substituteExercise(
  db: Database,
  logId: string,
  entryId: string,
  exerciseId: string,
) {
  if (!db.exercises[exerciseId])
    throw new Error("Exercise is not in the catalogue.");
  const log = db.strengthLogs[logId];
  if (!log || log.completed) throw new Error("This session cannot be changed.");
  const sets = log.sets.filter((s) => s.entryId === entryId);
  if (sets.some((s) => s.done))
    throw new Error(
      "Completed sets retain their exercise. Add a new exercise for the substitution.",
    );
  return {
    ...db,
    strengthLogs: {
      ...db.strengthLogs,
      [logId]: {
        ...log,
        sets: log.sets.map((s) =>
          s.entryId === entryId
            ? { ...s, exerciseId, weight: 0, done: false }
            : s,
        ),
      },
    },
  };
}
export function finishStrength(db: Database, logId: string): Database {
  const log = db.strengthLogs[logId];
  if (!log) throw new Error("Session not found.");
  if (log.completed) return db;
  if (!log.sessionId || !db.sessions[log.sessionId])
    throw new Error("Calendar session is missing.");
  const done = log.sets.filter((s) => s.done);
  if (!done.some((s) => s.kind !== "warmup"))
    throw new Error("Complete at least one working set before finishing.");
  if (!(log.minutes! > 0) || !Number.isFinite(log.minutes))
    throw new Error("Enter the actual session duration.");
  let next = completeSession(db, log.sessionId, log.minutes);
  const aid = `activity-${log.sessionId}`;
  next = {
    ...next,
    strengthLogs: {
      ...next.strengthLogs,
      [logId]: {
        ...log,
        completed: true,
        restEndsAt: undefined,
        workEndsAt: undefined,
      },
    },
    activities: {
      ...next.activities,
      [aid]: {
        ...next.activities[aid],
        rpe: Math.round(done.reduce((n, s) => n + s.rpe, 0) / done.length),
        notes: log.notes,
      },
    },
  };
  return next;
}
