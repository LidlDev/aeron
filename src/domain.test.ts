import { describe, it, expect } from "vitest";
import {
  seed,
  generatePlan,
  applyPlan,
  completeSession,
  coachReply,
  decideRecommendation,
  demoImport,
  validateDatabase,
  storage,
  duration,
  distance,
} from "./domain";
describe("AERON training workflows", () => {
  it("has 60 complete workouts, 30 exercises, valid history, and a four-week plan", () => {
    const db = seed();
    expect(
      Object.values(db.workouts).filter((w) =>
        /^(running|cycling|swimming|strength)-/.test(w.id),
      ),
    ).toHaveLength(60);
    expect(Object.keys(db.exercises)).toHaveLength(30);
    expect(Object.values(db.activities).length).toBeGreaterThan(80);
    expect(Object.values(db.plans)[0].weeks).toHaveLength(4);
    expect(validateDatabase(db)).toBe(true);
  });
  it("limits volume to recent baseline and availability while respecting rest days", () => {
    const db = seed();
    db.athlete.preferences.baseline = 4;
    db.athlete.preferences.weeklyHours = 14;
    const g = generatePlan(db.athlete, db.workouts);
    expect(g.plan.capacityMinutes).toEqual([240, 252, 264, 192]);
    for (const s of g.sessions) {
      expect((new Date(s.date + "T12:00:00").getDay() + 6) % 7).not.toBe(
        db.athlete.preferences.restDay,
      );
    }
    const volume = g.sessions
      .filter(
        (s) =>
          s.date <
          new Date(
            new Date(g.plan.start + "T12:00:00").getTime() + 7 * 86400000,
          )
            .toISOString()
            .slice(0, 10),
      )
      .reduce(
        (n, s) => n + duration(g.workouts.find((w) => w.id === s.workoutId)!),
        0,
      );
    expect(volume).toBeCloseTo(g.plan.weeks[0], 5);
    expect(volume).toBeLessThanOrEqual(240);
    expect(volume).toBeGreaterThan(216);
  });
  it("completion adds one activity and regenerating preserves completed history", () => {
    let db = seed();
    const s = Object.values(db.sessions).find((s) => s.status === "planned")!;
    const old = Object.keys(db.activities).length;
    db = completeSession(db, s.id);
    expect(Object.keys(db.activities)).toHaveLength(old + 1);
    db = completeSession(db, s.id);
    expect(Object.keys(db.activities)).toHaveLength(old + 1);
    db = applyPlan(db, generatePlan(db.athlete, db.workouts));
    expect(db.sessions[s.id].status).toBe("completed");
    expect(db.activities[`activity-${s.id}`]).toBeDefined();
  });
  it("calculates exact threshold duration and swimming set distance", () => {
    const db = seed();
    expect(duration(db.workouts["running-4"])).toBe(60);
    expect(distance(db.workouts["swimming-1"])).toBe(2400);
  });
  it("accepts and undoes a data-grounded coach adjustment", () => {
    let db = seed();
    const reply = coachReply(db, "I am feeling fatigued");
    const r = reply.recommendation!;
    expect(reply.text).toContain("fatigue");
    db.recommendations[r.id] = r;
    const old = db.sessions[r.sessionId].workoutId;
    db = decideRecommendation(db, r.id, "accepted");
    expect(db.sessions[r.sessionId].workoutId).not.toBe(old);
    expect(
      duration(db.workouts[db.sessions[r.sessionId].workoutId]),
    ).toBeLessThan(duration(r.workoutBefore));
    db = decideRecommendation(db, r.id, "undone");
    expect(db.sessions[r.sessionId].workoutId).toBe(old);
    expect(Object.values(db.revisions).map((r) => r.state)).toEqual(
      expect.arrayContaining(["Validated", "Approved", "Applied", "Reverted"]),
    );
  });
  it("deduplicates Strava demo imports", () => {
    const first = demoImport(seed());
    const count = Object.keys(first.activities).length;
    const second = demoImport(first);
    expect(Object.keys(second.activities)).toHaveLength(count);
    expect(second.integrations.strava.imports).toBe(3);
    expect(second.integrations.strava.status).toBe("Demo");
  });
  it("validates imports and rejects broken relationships", () => {
    const db = seed();
    expect(storage.import(JSON.stringify(db)).athlete.name).toBe("Alex");
    expect(() => storage.import('{"version":9}')).toThrow();
    const s = Object.values(db.sessions)[0];
    s.workoutId = "missing";
    expect(validateDatabase(db)).toBe(false);
  });
});
