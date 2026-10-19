import { describe, it, expect, vi } from "vitest";
import {
  seed,
  generatePlan,
  applyPlan,
  completeSession,
  coachReply,
  decideRecommendation,
  duration,
  distance,
  today,
  addDays,
  importActivity,
  demoImport,
  storage,
  validateDatabase,
  type Database,
} from "./domain";
import { migrateV2 } from "./migrations";
import {
  startStrength,
  updateStrengthSet,
  finishStrength,
  substituteExercise,
  loadCatalogue,
  exerciseHistory,
} from "./strength-core";
import {
  estimate1RM,
  readStrengthSession,
  nextPrescription,
  supersetUnits,
  setVolume,
} from "./strength-engine";
import { trainingSummary, phaseLabel } from "./metrics";
import { profilePoints, timeInZone, validateSwim } from "./workout-math";
import { duplicateSession, removeSession } from "./session-actions";
describe("V2 migration and storage integrity", () => {
  function v1() {
    const d = structuredClone(seed()) as unknown as Record<string, unknown>;
    d.version = 1;
    delete d.strengthWorkouts;
    delete d.zoneHistory;
    const logs = d.strengthLogs as Database["strengthLogs"];
    for (const l of Object.values(logs)) {
      delete l.sessionId;
      for (const s of l.sets) delete s.entryId;
    }
    return d;
  }
  it("preserves V1 identities, values, activity count and canonicalizes strength without duplication", () => {
    const before = v1();
    const after = migrateV2(before);
    expect(after.version).toBe(2);
    expect(after.athlete).toEqual(before.athlete);
    expect(Object.keys(after.activities)).toEqual(
      Object.keys(before.activities as object),
    );
    for (const l of Object.values(after.strengthLogs)) {
      expect(after.sessions[l.sessionId!]).toBeDefined();
      expect(l.sets.every((s) => s.sessionId === l.sessionId)).toBe(true);
    }
    expect(migrateV2(after)).toEqual(after);
    expect(validateDatabase(after)).toBe(true);
  });
  it("backs up the original on migration save and blocks corrupt-data overwrites", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => values.get(k) || null,
      setItem: (k: string, v: string) => values.set(k, v),
    });
    const original = JSON.stringify(v1());
    values.set("aeron.database.v1", original);
    const loaded = storage.load();
    storage.save(loaded.data);
    expect(values.get("aeron.database.v1.backup")).toBe(original);
    expect(JSON.parse(values.get("aeron.database.v2")!).version).toBe(2);
    values.set("aeron.database.v2", "broken json");
    storage.load();
    expect(() => storage.save(seed())).toThrow(/recovery/);
    expect(values.get("aeron.database.v2")).toBe("broken json");
    storage.replace(seed());
    expect(values.get("aeron.recovery.backup")).toBe("broken json");
    expect(
      validateDatabase(storage.import(values.get("aeron.database.v2")!)),
    ).toBe(true);
    vi.unstubAllGlobals();
  });
});
describe("OpenGym adapted strength engine", () => {
  it("imports text only, preserves mapped IDs and deduplicates upstream catalogue", async () => {
    const db = await loadCatalogue(seed());
    expect(Object.keys(db.exercises).length).toBe(1330);
    expect(db.exercises["ex-2"].upstreamIds).toContain("1760");
    expect(db.exercises["ex-2"].name).toBe("Goblet squat");
    expect(db.exercises["og:0001"].technique.length).toBeGreaterThan(1);
    expect(
      Object.values(db.exercises).every((e) => !("img" in e) && !("gif" in e)),
    ).toBe(true);
  });
  it("uses one planned strength session through logging and idempotent completion", () => {
    let db = seed();
    const s = Object.values(db.sessions).find(
      (s) =>
        s.status === "planned" && db.workouts[s.workoutId].sport === "Strength",
    )!;
    const id = s.id;
    const count = Object.keys(db.activities).length;
    const started = startStrength(db, "A", id);
    db = started.db;
    const log = db.strengthLogs[started.logId];
    expect(log.sessionId).toBe(id);
    const set = log.sets.find((s) => s.kind === "working")!;
    db = updateStrengthSet(db, log.id, set.id, {
      weight: 20,
      reps: 10,
      done: true,
    });
    db = finishStrength(db, log.id);
    expect(db.sessions[id].status).toBe("completed");
    expect(Object.keys(db.activities)).toHaveLength(count + 1);
    expect(db.activities[`activity-${id}`].sessionId).toBe(id);
    expect(finishStrength(db, log.id)).toEqual(db);
    expect(
      exerciseHistory(db, set.exerciseId)
        .at(-1)
        ?.sets.some((s) => s.weight === 20 && s.reps === 10),
    ).toBe(true);
  });
  it("validates set inputs and keeps separate occurrence identities during substitution", () => {
    const started = startStrength(seed(), "A");
    let db = started.db;
    const logId = started.logId;
    const entry = db.strengthLogs[logId].sets[0].entryId!;
    expect(() =>
      updateStrengthSet(db, logId, db.strengthLogs[logId].sets[0].id, {
        weight: -5,
      }),
    ).toThrow();
    db = substituteExercise(db, logId, entry, "ex-6");
    expect(
      db.strengthLogs[logId].sets
        .filter((s) => s.entryId === entry)
        .every((s) => s.exerciseId === "ex-6"),
    ).toBe(true);
    db = updateStrengthSet(db, logId, db.strengthLogs[logId].sets[0].id, {
      done: true,
    });
    expect(() => substituteExercise(db, logId, entry, "ex-2")).toThrow(
      /Completed/,
    );
  });
  it("treats incomplete prescriptions as misses and excludes warmups from progression", () => {
    const { db, logId } = startStrength(seed(), "A");
    const sets = db.strengthLogs[logId].sets.filter(
      (s) => s.exerciseId === "ex-2",
    );
    expect(readStrengthSession(sets).ok).toBe(false);
    const hit = sets.map((s) => ({
      ...s,
      done: s.kind !== "warmup",
      reps: 8,
      weight: 20,
    }));
    expect(readStrengthSession(hit).ok).toBe(true);
    const cfg = {
      policy: "linear" as const,
      reps: 8,
      minReps: 6,
      weight: 20,
      seconds: 30,
      increment: 2.5,
    };
    expect(nextPrescription([hit], cfg).weight).toBe(22.5);
    expect(nextPrescription([sets], cfg).kind).toBe("hold");
    expect(nextPrescription([sets, sets, sets], cfg).kind).toBe("deload");
    expect(
      supersetUnits([{ superset: "A" }, { superset: "A" }, { superset: "" }]),
    ).toEqual([[0, 1], [2]]);
  });
  it("bounds estimated maximums and does not assign volume to timed holds", () => {
    expect(estimate1RM(100, 10)).toBe(133.3);
    expect(estimate1RM(100, 13)).toBeNull();
    expect(estimate1RM(Infinity, 3)).toBeNull();
    expect(estimate1RM(100, 1)).toBe(100);
    const { db, logId } = startStrength(seed(), "A");
    const set = db.strengthLogs[logId].sets[0];
    expect(
      setVolume({ ...set, mode: "time", done: true, weight: 20, reps: 10 }),
    ).toBe(0);
  });
});
describe("Plan, coach, metrics and import consistency", () => {
  it("uses capacity as ceiling, preserves rest and defaults to two separated strength sessions", () => {
    const db = seed();
    db.athlete.preferences.baseline = 4;
    db.athlete.preferences.weeklyHours = 14;
    const g = generatePlan(db.athlete, db.workouts);
    expect(g.plan.capacityMinutes).toEqual([240, 252, 264, 192]);
    expect(phaseLabel(db)).toBe("Base building — race not selected");
    const strength = g.sessions.filter(
      (s) =>
        s.date < addDays(g.plan.start, 7) &&
        g.workouts.find((w) => w.id === s.workoutId)?.sport === "Strength",
    );
    expect(strength).toHaveLength(2);
    expect(
      strength
        .map(
          (s) =>
            g.workouts.find((w) => w.id === s.workoutId)!.strengthTemplateId,
        )
        .sort(),
    ).toEqual(["A", "B"]);
    for (const s of g.sessions)
      expect((new Date(s.date + "T12:00:00").getDay() + 6) % 7).not.toBe(
        db.athlete.preferences.restDay,
      );
    const days = strength.map(
      (s) => (new Date(s.date + "T12:00:00").getDay() + 6) % 7,
    );
    expect(
      days.every(
        (d) =>
          d + 1 !== db.athlete.preferences.longRide &&
          d + 1 !== db.athlete.preferences.longRun,
      ),
    ).toBe(true);
  });
  it("handles unavailable days and no double sessions without creating training debt", () => {
    const db = seed();
    const p = db.athlete.preferences;
    p.doubleDays = false;
    p.availableDays = [1, 3, 5, 6];
    const g = generatePlan(db.athlete, db.workouts);
    expect(new Set(g.sessions.map((s) => s.date)).size).toBe(g.sessions.length);
    expect(
      g.sessions.every((s) =>
        p.availableDays.includes(
          (new Date(s.date + "T12:00:00").getDay() + 6) % 7,
        ),
      ),
    ).toBe(true);
    db.sessions["missed"] = {
      id: "missed",
      date: addDays(today(), -1),
      workoutId: "running-0",
      status: "skipped",
      notes: "",
    };
    expect(generatePlan(db.athlete, db.workouts).plan.weeks).toEqual(
      g.plan.weeks,
    );
  });
  it("preserves approved changes and completed history on regeneration, validates stale revisions and undoes exact snapshot", () => {
    let db = seed();
    const r = coachReply(db, "feeling fatigued").recommendation!;
    db.recommendations[r.id] = r;
    db = decideRecommendation(db, r.id, "accepted");
    expect(db.recommendations[r.id].lifecycle).toBe("Applied");
    expect(Object.values(db.revisions).map((r) => r.state)).toEqual(
      expect.arrayContaining(["Validated", "Approved", "Applied"]),
    );
    db = applyPlan(db, generatePlan(db.athlete, db.workouts));
    expect(db.sessions[r.sessionId].workoutId).toBe(r.after.workoutId);
    db = decideRecommendation(db, r.id, "undone");
    expect(db.sessions[r.sessionId]).toEqual(r.before);
    const stale = coachReply(db, "45 minutes tomorrow").recommendation!;
    db.recommendations[stale.id] = stale;
    db.sessions[stale.sessionId] = {
      ...db.sessions[stale.sessionId],
      date: addDays(stale.before.date, 1),
    };
    expect(() => decideRecommendation(db, stale.id, "accepted")).toThrow(
      /stale/,
    );
  });
  it("matches imported activities once and updates canonical completion without duplicates", () => {
    let db = seed();
    const date = addDays(today(), -1);
    db.sessions["matching"] = {
      id: "matching",
      date,
      workoutId: "cycling-0",
      status: "planned",
      notes: "",
    };
    db = demoImport(db);
    expect(db.sessions.matching.status).toBe("completed");
    expect(db.activities["strava-demo-0"].sessionId).toBe("matching");
    const n = Object.keys(db.activities).length;
    expect(Object.keys(demoImport(db).activities)).toHaveLength(n);
    expect(() =>
      importActivity(db, {
        ...db.activities["strava-demo-0"],
        id: "bad",
        minutes: NaN,
      }),
    ).toThrow();
  });
  it("derives dashboard totals exactly from canonical activity changes and session lifecycle", () => {
    let db = seed();
    const before = trainingSummary(db);
    const s = Object.values(db.sessions).find((s) => s.status === "planned")!;
    db = completeSession(db, s.id);
    const after = trainingSummary(db);
    expect(after.completedMinutes - before.completedMinutes).toBeCloseTo(
      duration(db.workouts[s.workoutId]),
    );
    const dupe = duplicateSession(db, s.id);
    expect(
      Object.values(dupe.sessions).filter((s) => s.status === "planned"),
    ).toHaveLength(
      Object.values(db.sessions).filter((s) => s.status === "planned").length +
        1,
    );
    const removed = removeSession(db, s.id);
    expect(Object.keys(removed.activities)).toEqual(Object.keys(db.activities));
    expect(removed.activities[`activity-${s.id}`].sessionId).toBeUndefined();
  });
  it("includes all rest periods in profiles and preserves exact swimming totals", () => {
    const db = seed();
    for (const w of Object.values(db.workouts)) {
      expect(profilePoints(w).at(-1)!.end).toBeCloseTo(duration(w));
      expect(timeInZone(w).reduce((n, z) => n + z.minutes, 0)).toBeCloseTo(
        duration(w),
      );
    }
    expect(duration(db.workouts["running-4"])).toBe(60);
    expect(distance(db.workouts["swimming-1"])).toBe(2400);
    const w = structuredClone(db.workouts["swimming-1"]);
    w.steps[0].distance = 425;
    w.poolLength = 50;
    expect(validateSwim(w)).toBe(false);
  });
});

describe("Regression snapshots and incomplete progression", () => {
  it("does not advance after working sets are removed from an incomplete prescription", () => {
    const { db, logId } = startStrength(seed(), "A");
    const sets = db.strengthLogs[logId].sets
      .filter((s) => s.exerciseId === "ex-2" && s.kind === "working")
      .map((s) => ({ ...s, done: true, reps: 8, weight: 20 }));
    expect(readStrengthSession(sets).ok).toBe(true);
    expect(readStrengthSession(sets.slice(0, 2)).ok).toBe(false);
  });
  it("keeps generated swim distances divisible by pool length and target pacing consistent", () => {
    const db = seed();
    db.athlete.preferences.baseline = 4;
    const g = generatePlan(db.athlete, db.workouts);
    for (const w of g.workouts.filter((w) => w.sport === "Swimming"))
      for (const s of w.steps) {
        expect(s.distance % 25).toBe(0);
        if (s.distance) expect(s.minutes / s.distance).toBeCloseTo(0.02);
      }
  });
});

describe("V2 metric semantics", () => {
  it("does not invent a prescription or improve adherence for unmatched imports", () => {
    const db = seed();
    const from = addDays(today(), -7);
    const before = trainingSummary(db, from, today());
    const next = importActivity(db, {
      id: "unmatched",
      workoutId: "cycling-0",
      date: today(),
      minutes: 60,
      distance: 25,
      rpe: 4,
      source: "Strava demo",
      notes: "",
    });
    const after = trainingSummary(next, from, today());
    expect(after.completedMinutes).toBe(before.completedMinutes + 60);
    expect(after.plannedMinutes).toBe(before.plannedMinutes);
    expect(after.due).toBe(before.due);
  });
  it("honors an explicit manual template load while keeping estimated records separate", () => {
    const { db, logId } = startStrength(seed(), "A");
    const sets = db.strengthLogs[logId].sets
      .filter((s) => s.kind === "working")
      .map((s) => ({ ...s, done: true, reps: 8, weight: 20 }));
    expect(
      nextPrescription([sets], {
        policy: "off",
        weight: 40,
        reps: 8,
        minReps: 6,
        seconds: 30,
        increment: 2.5,
      }).weight,
    ).toBe(40);
  });
});

describe("Canonical strength history deletion guard", () => {
  it("archives a completed strength calendar entry without breaking logs or duplicating history", () => {
    const started = startStrength(seed(), "A");
    let db = started.db;
    const logId = started.logId;
    const log = db.strengthLogs[logId];
    expect(() => removeSession(db, log.sessionId!)).toThrow(/active strength/);
    const regenerated = applyPlan(db, generatePlan(db.athlete, db.workouts));
    expect(regenerated.sessions[log.sessionId!]).toBeDefined();
    expect(validateDatabase(regenerated)).toBe(true);
    const set = log.sets.find((s) => s.kind === "working")!;
    db = updateStrengthSet(db, logId, set.id, { done: true });
    db = finishStrength(db, logId);
    const count = Object.keys(db.activities).length;
    db = removeSession(db, log.sessionId!);
    expect(db.sessions[log.sessionId!].archived).toBe(true);
    expect(validateDatabase(migrateV2(db))).toBe(true);
    expect(Object.keys(db.activities)).toHaveLength(count);
  });
});

describe("Strength record provenance", () => {
  it("shows load and reps from the same actual set rather than combining independent maxima", () => {
    const started = startStrength(seed(), "A");
    let db = started.db;
    const log = db.strengthLogs[started.logId];
    const sets = log.sets.filter(
      (s) => s.exerciseId === "ex-2" && s.kind === "working",
    );
    db = updateStrengthSet(db, log.id, sets[0].id, {
      weight: 40,
      reps: 6,
      done: true,
    });
    db = updateStrengthSet(db, log.id, sets[1].id, {
      weight: 20,
      reps: 20,
      done: true,
    });
    db = finishStrength(db, log.id);
    const record = exerciseHistory(db, "ex-2").at(-1)!;
    expect(record.record).toBe("40kg × 6");
    expect(record.maxReps).toBe(20);
    expect(record.estimated1RM).toBe(48);
  });
});
