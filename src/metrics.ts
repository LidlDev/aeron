import {
  type Database,
  today,
  monday,
  addDays,
  duration,
  sports,
  type Sport,
} from "./domain";
export function trainingSummary(
  db: Database,
  from = monday(),
  to = addDays(monday(), 6),
) {
  const sessions = Object.values(db.sessions).filter(
    (s) => !s.archived && s.date >= from && s.date <= to,
  );
  const activities = Object.values(db.activities).filter(
    (a) => a.date >= from && a.date <= to,
  );
  const due = sessions.filter(
    (s) => s.date <= today() && s.origin !== "import",
  );
  const completedMinutes = activities.reduce((n, a) => n + a.minutes, 0);
  const plannedMinutes = sessions
    .filter((s) => s.origin !== "import")
    .reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0);
  const done = due.filter((s) => s.status === "completed").length;
  return {
    sessions,
    activities,
    completedMinutes,
    plannedMinutes,
    completedSessions: activities.length,
    due: due.length,
    done,
    adherence: due.length ? Math.round((done / due.length) * 100) : null,
    load: activities.reduce((n, a) => n + a.minutes * a.rpe, 0),
    distribution: sports.map((sport) => ({
      name: sport,
      value: activities
        .filter((a) => db.workouts[a.workoutId]?.sport === sport)
        .reduce((n, a) => n + a.minutes, 0),
      planned: sessions
        .filter(
          (s) =>
            s.origin !== "import" && db.workouts[s.workoutId]?.sport === sport,
        )
        .reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0),
    })),
  };
}
export function latestCheckin(db: Database) {
  return Object.values(db.recovery)
    .filter((r) => r.date <= today())
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
export function upcomingSessions(db: Database) {
  return Object.values(db.sessions)
    .filter((s) => !s.archived && s.date >= today() && s.status === "planned")
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function phaseLabel(db: Database) {
  const phase = Object.values(db.plans).at(-1)?.phase || "Base";
  return db.athlete.raceDate
    ? `${phase} · ${db.athlete.raceDate}`
    : `${phase === "Base" ? "Base building" : phase} — race not selected`;
}
export function sportProgress(
  db: Database,
  sport: Sport,
  from: string,
  to: string,
) {
  return Object.values(db.activities)
    .filter(
      (a) =>
        a.date >= from &&
        a.date <= to &&
        db.workouts[a.workoutId]?.sport === sport,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({
      date: a.date,
      Duration: a.minutes,
      Distance: Math.round(a.distance * 10) / 10,
      Power: a.power,
      Pace: a.pace ? Math.round(a.pace / 6) / 10 : undefined,
      RPE: a.rpe,
      Load: a.minutes * a.rpe,
    }));
}
