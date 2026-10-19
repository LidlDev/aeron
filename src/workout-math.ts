import { type Workout, type WorkoutStep } from "./domain";
export function expandedSteps(w: Workout) {
  return w.steps.flatMap((s) =>
    Array.from({ length: s.reps }, (_, i) => [
      {
        ...s,
        reps: 1,
        label: s.reps > 1 ? `${s.name} ${i + 1}/${s.reps}` : s.name,
        isRest: false,
      },
      ...(s.rest > 0 && i < s.reps - 1
        ? [
            {
              ...s,
              reps: 1,
              minutes: s.rest / 60,
              name: "Recovery",
              label: "Recovery",
              zone: 1,
              target: "Easy recovery",
              isRest: true,
              distance: 0,
            },
          ]
        : []),
    ]).flat(),
  );
}
export function profilePoints(w: Workout) {
  let elapsed = 0;
  return expandedSteps(w).map((s) => {
    const point = { ...s, start: elapsed, end: elapsed + s.minutes };
    elapsed += s.minutes;
    return point;
  });
}
export function powerRange(step: WorkoutStep, ftp: number) {
  const match = step.target.match(/(\d+)(?:[–-](\d+))?\s*%/);
  return match
    ? [
        Math.round((+match[1] * ftp) / 100),
        Math.round((+(match[2] || match[1]) * ftp) / 100),
      ]
    : null;
}
export function timeInZone(w: Workout) {
  return [1, 2, 3, 4, 5].map((zone) => ({
    zone,
    minutes: profilePoints(w)
      .filter((s) => s.zone === zone)
      .reduce((n, s) => n + s.minutes, 0),
  }));
}
export function validateSwim(w: Workout) {
  const pool = w.poolLength || 25;
  return (
    w.sport !== "Swimming" ||
    w.steps.every((s) => s.distance === 0 || s.distance % pool === 0)
  );
}
