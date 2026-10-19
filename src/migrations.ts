import type { Database } from "./domain";
import { defaultStrengthWorkouts, annotateExercise } from "./strength-core";
/** Pure, idempotent migration. Original IDs, actual activities and entered values are retained. */
export function migrateV2(input: unknown): Database {
  const data = structuredClone(input) as Database;
  if (!data || ![1, 2].includes(data.version))
    throw new Error("Unsupported AERON storage version.");
  if (
    !data.athlete?.preferences ||
    !data.workouts ||
    !data.sessions ||
    !data.activities ||
    !data.strengthLogs ||
    !data.exercises
  )
    throw new Error("Incomplete AERON data.");
  data.version = 2;
  data.strengthWorkouts = {
    ...defaultStrengthWorkouts(),
    ...data.strengthWorkouts,
  };
  data.zoneHistory ??= [
    { date: new Date().toISOString().slice(0, 10), ftp: data.zones.ftp },
  ];
  data.exercises = Object.fromEntries(
    Object.entries(data.exercises).map(([k, e]) => [k, annotateExercise(e)]),
  );
  for (const w of Object.values(data.workouts))
    if (w.sport === "Strength" && !w.strengthTemplateId)
      w.strengthTemplateId = /Strength B|Full body|resilience/i.test(w.title)
        ? "B"
        : "A";
  for (const log of Object.values(data.strengthLogs)) {
    if (log.sessionId && data.sessions[log.sessionId]) continue;
    const existingActivity = Object.values(data.activities).find(
      (a) => a.id === `strength-log-${log.id}` || log.id === `log-${a.id}`,
    );
    const candidates = Object.values(data.sessions).filter(
      (s) =>
        s.date === log.date &&
        s.status === "planned" &&
        data.workouts[s.workoutId]?.sport === "Strength" &&
        (data.workouts[s.workoutId].strengthTemplateId || "A") ===
          (log.template === "B" ? "B" : "A"),
    );
    const sameSession = existingActivity?.sessionId
      ? data.sessions[existingActivity.sessionId]
      : candidates.length === 1
        ? candidates[0]
        : undefined;
    const sid = sameSession ? sameSession.id : `migrated-${log.id}`;
    let wid = sameSession ? sameSession.workoutId : existingActivity?.workoutId;
    wid ??= log.template === "B" ? "strength-1" : "strength-0";
    if (!data.workouts[wid])
      wid = Object.values(data.workouts).find(
        (w) => w.sport === "Strength",
      )?.id;
    if (!wid)
      throw new Error("A strength log has no recoverable workout definition.");
    data.sessions[sid] ??= {
      id: sid,
      date: log.date,
      workoutId: wid,
      status: log.completed ? "completed" : "planned",
      notes: log.notes,
    };
    if (log.completed) data.sessions[sid].status = "completed";
    log.sessionId = sid;
    log.minutes ??= existingActivity?.minutes ?? 45;
    log.activeEntryId ??= log.sets[0]?.exerciseId;
    log.sets = log.sets.map((s) => ({
      ...s,
      sessionId: sid,
      entryId: s.entryId || s.exerciseId,
      kind: s.kind || "working",
      mode: s.mode || "reps",
      restSeconds: s.restSeconds ?? 90,
      targetReps: s.targetReps ?? s.reps,
    }));
    if (existingActivity) {
      existingActivity.sessionId = sid;
    } else if (log.completed) {
      const id = `activity-${sid}`;
      data.activities[id] = {
        id,
        sessionId: sid,
        workoutId: wid,
        date: log.date,
        minutes: log.minutes,
        distance: 0,
        rpe: 6,
        source: "AERON",
        notes: log.notes,
      };
    }
  }
  for (const p of Object.values(data.plans))
    p.sessionIds = p.sessionIds.filter((id) => !!data.sessions[id]);
  return data;
}
