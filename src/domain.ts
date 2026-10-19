import { migrateV2 } from "./migrations";
export type Sport = "Running" | "Cycling" | "Swimming" | "Strength";
export const sports: Sport[] = ["Swimming", "Cycling", "Running", "Strength"];
export const colors: Record<Sport, string> = {
  Running: "#FF875B",
  Cycling: "#D6FF43",
  Swimming: "#43C7E8",
  Strength: "#A68CFF",
};
export const today = () => dateKey(new Date());
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(s: string, n: number) {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function monday(s = today()) {
  const d = new Date(s + "T12:00:00");
  return addDays(s, -((d.getDay() + 6) % 7));
}
export const uid = () => crypto.randomUUID();
export const hours = (m: number) => {
  const n = Math.round(m);
  return `${Math.floor(n / 60)}h ${n % 60}m`;
};
export const formatDistance = (km: number, units: "Metric" | "Imperial") =>
  `${(units === "Imperial" ? km * 0.621371 : km).toFixed(1)} ${units === "Imperial" ? "mi" : "km"}`;
export interface AthletePreferences {
  units: "Metric" | "Imperial";
  timezone: string;
  availableDays: number[];
  weeklyHours: number;
  baseline: number;
  longRide: number;
  longRun: number;
  restDay: number;
  swimDays: number[];
  doubleDays: boolean;
  strengthSessions: number;
  strengthLocation: string;
  strengthEquipment: string;
  strengthExperience: string;
  exercisePreferences: string;
  diet: string;
  restrictions: string;
  products: string;
  nutritionTracking: boolean;
  reducedMotion: boolean;
  notifications: boolean;
  equipment: string[];
  swimBaseline: number;
  bikeBaseline: number;
  runBaseline: number;
}
export interface Athlete {
  id: string;
  name: string;
  age: string;
  experience: string;
  primarySport: string;
  goal: string;
  raceDate: string;
  preferences: AthletePreferences;
}
export interface TrainingZones {
  ftp: number;
  maxHR: number;
  thresholdPace: number;
  swimPace: number;
}
export interface WorkoutStep {
  id: string;
  name: string;
  minutes: number;
  reps: number;
  distance: number;
  rest: number;
  target: string;
  zone: number;
  cadence?: number;
}
export interface Workout {
  custom?: boolean;
  id: string;
  title: string;
  sport: Sport;
  description: string;
  objective: string;
  difficulty: string;
  equipment: string[];
  steps: WorkoutStep[];
  notes: string;
  indoor: boolean;
  poolLength?: 25 | 50;
  brickId?: string;
  strengthTemplateId?: string;
}
export interface PlannedSession {
  origin?: "plan" | "manual" | "import";
  coachProtected?: boolean;
  id: string;
  workoutId: string;
  date: string;
  status: "planned" | "completed" | "skipped";
  notes: string;
}
export interface CompletedActivity {
  id: string;
  sessionId?: string;
  workoutId: string;
  date: string;
  minutes: number;
  distance: number;
  rpe: number;
  source: "Demo history" | "AERON" | "Strava demo";
  stepCompletion?: { completed: number; total: number };
  power?: number;
  pace?: number;
  notes: string;
}
export interface TrainingPlan {
  capacityMinutes?: number[];
  id: string;
  phase: "Base" | "Build" | "Peak" | "Taper" | "Recovery";
  start: string;
  weeks: number[];
  objective: string;
  sessionIds: string[];
}
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscles: string[];
  equipment: string;
  difficulty: string;
  unilateral?: boolean;
  compound?: boolean;
  origin?: string;
  classification?: string;
  upstreamIds?: string[];
  source?: string;
  technique: string[];
  guidance: string;
  mistakes: string;
  cues: string;
  substitutions: string[];
}
export interface StrengthSet {
  entryId?: string;
  kind?: "warmup" | "working";
  mode?: "reps" | "time";
  seconds?: number;
  targetSeconds?: number;
  targetReps?: number;
  targetSetCount?: number;
  restSeconds?: number;
  rir?: number;
  superset?: string;
  id: string;
  sessionId: string;
  exerciseId: string;
  reps: number;
  weight: number;
  rpe: number;
  done: boolean;
}
export interface StrengthExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  minReps: number;
  weight: number;
  seconds: number;
  mode: "reps" | "time";
  restSeconds: number;
  warmupSets: number;
  rpe: number;
  rir: number;
  progression: "off" | "linear" | "double" | "time";
  increment: number;
  superset: string;
}
export interface StrengthWorkout {
  id: string;
  name: string;
  minutes: number;
  notes: string;
  entries: StrengthExercise[];
}
export interface StrengthLog {
  sessionId?: string;
  minutes?: number;
  activeEntryId?: string;
  startedAt?: number;
  elapsedSeconds?: number;
  paused?: boolean;
  restEndsAt?: number;
  restRemaining?: number;
  workEndsAt?: number;
  workRemaining?: number;
  workSetId?: string;

  id: string;
  date: string;
  template: string;
  sets: StrengthSet[];
  notes: string;
  completed: boolean;
}
export interface RecoveryCheckin {
  id: string;
  date: string;
  sleep: number;
  quality: number;
  fatigue: number;
  soreness: number;
  motivation: number;
  stress: number;
  readiness: number;
  notes: string;
}
export interface NutritionEntry {
  id: string;
  date: string;
  type: string;
  name: string;
  fluid: number;
  notes: string;
}
export interface FuelItem {
  id: string;
  name: string;
  carbs: number;
  fluid: number;
  sodium: number;
  calories: number;
  quantity: number;
}
export interface FuelingPlan {
  id: string;
  name: string;
  sessionId: string;
  sport: string;
  duration: number;
  temperature: number;
  intensity: string;
  tolerance: number;
  items: FuelItem[];
}
export type RevisionState =
  "Proposed" | "Validated" | "Approved" | "Rejected" | "Applied" | "Reverted";
export interface CoachRecommendation {
  lifecycle?: RevisionState;
  trigger?: string;
  evidence?: string[];
  reason?: string;
  expectedEffect?: string;
  confidence?: string;

  id: string;
  text: string;
  sessionId: string;
  before: PlannedSession;
  after: PlannedSession;
  workoutBefore: Workout;
  workoutAfter: Workout;
  status: "pending" | "accepted" | "rejected" | "undone";
}
export interface PlanRevision {
  state?: RevisionState;
  id: string;
  date: string;
  recommendationId: string;
  description: string;
}
export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  recommendationId?: string;
}
export interface IntegrationAccount {
  id: string;
  provider: "Garmin" | "Strava";
  status: "Not connected" | "Demo";
  lastSync: string;
  imports: number;
}
export interface WorkoutExport {
  id: string;
  workoutId: string;
  date: string;
  format: "JSON";
  manual: boolean;
}
export interface Database {
  version: 2;
  strengthWorkouts: Record<string, StrengthWorkout>;
  zoneHistory: { date: string; ftp: number }[];
  onboarded: boolean;
  athlete: Athlete;
  zones: TrainingZones;
  workouts: Record<string, Workout>;
  sessions: Record<string, PlannedSession>;
  activities: Record<string, CompletedActivity>;
  plans: Record<string, TrainingPlan>;
  exercises: Record<string, Exercise>;
  strengthLogs: Record<string, StrengthLog>;
  recovery: Record<string, RecoveryCheckin>;
  nutrition: Record<string, NutritionEntry>;
  fueling: Record<string, FuelingPlan>;
  recommendations: Record<string, CoachRecommendation>;
  revisions: Record<string, PlanRevision>;
  messages: CoachMessage[];
  integrations: Record<string, IntegrationAccount>;
  exports: Record<string, WorkoutExport>;
}
export function duration(w: Workout) {
  return w.steps.reduce(
    (a, s) => a + s.minutes * s.reps + (s.rest * Math.max(0, s.reps - 1)) / 60,
    0,
  );
}
export function distance(w: Workout) {
  return w.steps.reduce((a, s) => a + s.distance * s.reps, 0);
}
export function estimateDistance(w: Workout) {
  const d = distance(w);
  return d
    ? d / 1000
    : w.sport === "Running"
      ? duration(w) / 5.7
      : w.sport === "Cycling"
        ? duration(w) * 0.46
        : 0;
}
export const step = (
  name: string,
  minutes: number,
  zone = 2,
  reps = 1,
  dist = 0,
  rest = 0,
  target = "RPE 3–4",
): WorkoutStep => ({
  id: uid(),
  name,
  minutes,
  zone,
  reps,
  distance: dist,
  rest,
  target,
});
const runNames = [
  "Easy aerobic",
  "Recovery miles",
  "Long endurance",
  "Tempo progression",
  "Threshold intervals",
  "VO2 max intervals",
  "Hill repeats",
  "Progression run",
  "Brick run",
  "Race-pace rehearsal",
];
const bikeNames = [
  "Zone 2 endurance",
  "Long aerobic ride",
  "Sweet spot intervals",
  "Threshold builder",
  "VO2 power repeats",
  "Cadence ladder",
  "Recovery spin",
  "Race-pace simulation",
  "Brick preparation",
  "Over-under intervals",
];
const swimNames = [
  "Technique foundations",
  "Aerobic endurance",
  "CSS threshold",
  "Speed development",
  "Open-water skills",
  "Race simulation",
  "Pull endurance",
  "Kick and balance",
  "Pacing discipline",
  "Recovery swim",
];
export function makeLibrary(): Record<string, Workout> {
  const out: Record<string, Workout> = {};
  for (const sport of ["Running", "Cycling", "Swimming"] as Sport[])
    for (let i = 0; i < 10; i++) {
      const id = `${sport.toLowerCase()}-${i}`;
      let steps: WorkoutStep[];
      if (sport === "Swimming") {
        const names = [
          "Easy warm-up",
          "Technique drills",
          "Aerobic main set",
          "Moderate build",
          "Easy cool-down",
        ];
        const sets = [
          [400, 1],
          [100, 4],
          [300, 4],
          [50, 4],
          [200, 1],
        ];
        steps = sets.map(([d, r], j) =>
          step(
            names[j],
            d / 50,
            j === 3 ? 3 : 2,
            r,
            d,
            j === 1 ? 20 : j === 2 ? 30 : 15,
            j === 1 ? "Relaxed technique" : "Controlled aerobic pace",
          ),
        );
        if (i !== 1) {
          steps[2].reps = 2 + (i % 4);
          steps[2].target =
            i === 2
              ? "CSS pace, RPE 7"
              : i === 3
                ? "Fast, controlled RPE 8"
                : "RPE 4–5";
        }
      } else if (sport === "Running") {
        steps =
          i === 4
            ? [
                step("Easy warm-up", 12, 1),
                step(
                  "Threshold repetition",
                  5,
                  4,
                  5,
                  0,
                  120,
                  "Threshold pace · RPE 7–8",
                ),
                step("Easy cool-down", 15, 1),
              ]
            : i < 3 || i === 8
              ? [
                  step("Easy warm-up", 5, 1),
                  step(
                    "Steady aerobic running",
                    i === 2 ? 65 : i === 8 ? 15 : 30,
                    2,
                    1,
                    0,
                    0,
                    "Conversational pace · RPE 3–4",
                  ),
                  step("Easy cool-down", 5, 1),
                ]
              : [
                  step("Easy warm-up", 12, 1),
                  step(
                    i === 6 ? "Uphill effort" : "Quality repetition",
                    i === 5 ? 3 : 4,
                    i === 5 ? 5 : 3,
                    5,
                    0,
                    90,
                    i === 5 ? "RPE 8–9" : "RPE 6–7",
                  ),
                  step("Easy cool-down", 10, 1),
                ];
      } else {
        steps =
          i === 0 || i === 1 || i === 6
            ? [
                step("Progressive warm-up", 10, 1),
                step(
                  "Aerobic endurance",
                  i === 1 ? 100 : i === 6 ? 20 : 45,
                  2,
                  1,
                  0,
                  0,
                  "60–70% FTP · RPE 3",
                ),
                step("Easy spin", 5, 1),
              ]
            : [
                step("Progressive warm-up", 12, 1),
                {
                  ...step(
                    "Power interval",
                    i === 4 ? 3 : 8,
                    i === 4 ? 5 : 3,
                    4,
                    0,
                    180,
                    i === 4
                      ? "110–120% FTP"
                      : i === 2
                        ? "88–94% FTP"
                        : "95–100% FTP",
                  ),
                  cadence: i === 5 ? 100 : 90,
                },
                step("Easy spin", 10, 1),
              ];
      }
      out[id] = {
        id,
        title: (sport === "Running"
          ? runNames
          : sport === "Cycling"
            ? bikeNames
            : swimNames)[i],
        sport,
        steps,
        description:
          sport === "Swimming"
            ? "Build water confidence with purposeful technique and repeatable pacing."
            : sport === "Cycling"
              ? "Develop sustainable power with smooth cadence and controlled effort."
              : "Build durable aerobic fitness with relaxed mechanics and consistent effort.",
        objective:
          i < 3 ? "Aerobic endurance" : i === 6 ? "Technique" : "Performance",
        difficulty: i < 3 ? "Foundation" : "Intermediate",
        equipment:
          sport === "Swimming"
            ? ["25m pool", "Pull buoy"]
            : sport === "Cycling"
              ? ["Road bike", "Smart trainer"]
              : ["Running shoes"],
        notes:
          "Begin conservatively. Keep effort controlled and adjust the session if fatigue changes your form.",
        indoor: sport === "Swimming",
      };
    }
  return out;
}
const exData: [string, string, string, string, string][] = [
  [
    "Back squat",
    "Squat",
    "Quads,Glutes",
    "Barbell",
    "Keep the bar over your midfoot and sit between your hips.",
  ],
  [
    "Front squat",
    "Squat",
    "Quads,Core",
    "Barbell",
    "Keep elbows high and maintain an upright torso.",
  ],
  [
    "Goblet squat",
    "Squat",
    "Quads,Glutes",
    "Dumbbell",
    "Hold the bell close to your chest and track knees over toes.",
  ],
  [
    "Romanian deadlift",
    "Hinge",
    "Hamstrings,Glutes",
    "Barbell",
    "Push hips back with soft knees and keep the bar close.",
  ],
  [
    "Trap-bar deadlift",
    "Hinge",
    "Glutes,Quads",
    "Trap bar",
    "Brace, drive through the floor, and stand tall without leaning back.",
  ],
  [
    "Bulgarian split squat",
    "Lunge",
    "Quads,Glutes",
    "Dumbbells",
    "Lower straight down with your front foot planted.",
  ],
  [
    "Reverse lunge",
    "Lunge",
    "Glutes,Quads",
    "Dumbbells",
    "Step back and lower the rear knee under your hip.",
  ],
  [
    "Step-up",
    "Lunge",
    "Glutes,Quads",
    "Box",
    "Drive through the elevated foot without pushing off the trailing leg.",
  ],
  [
    "Hip thrust",
    "Hinge",
    "Glutes",
    "Bench",
    "Tuck your ribs and finish with hips fully extended.",
  ],
  [
    "Single-leg Romanian deadlift",
    "Hinge",
    "Hamstrings,Hip stabilizers",
    "Dumbbell",
    "Keep both hips square as the back leg reaches behind.",
  ],
  [
    "Standing calf raise",
    "Calf and ankle",
    "Gastrocnemius",
    "Dumbbells",
    "Rise fully onto the ball of the foot and lower slowly.",
  ],
  [
    "Seated calf raise",
    "Calf and ankle",
    "Soleus",
    "Dumbbell",
    "Keep knees bent and move through your full ankle range.",
  ],
  [
    "Bench press",
    "Push",
    "Chest,Triceps",
    "Barbell",
    "Set shoulder blades against the bench and lower to mid-chest.",
  ],
  [
    "Push-up",
    "Push",
    "Chest,Core",
    "Bodyweight",
    "Maintain a straight line from head to heel and lower as a unit.",
  ],
  [
    "Dumbbell row",
    "Pull",
    "Back,Biceps",
    "Dumbbell",
    "Pull your elbow toward your hip without rotating your trunk.",
  ],
  [
    "Pull-up",
    "Pull",
    "Lats,Biceps",
    "Pull-up bar",
    "Start from active shoulders and bring the chest toward the bar.",
  ],
  [
    "Lat pulldown",
    "Pull",
    "Lats,Biceps",
    "Cable machine",
    "Pull elbows down while keeping your torso steady.",
  ],
  [
    "Overhead press",
    "Push",
    "Shoulders,Triceps",
    "Dumbbells",
    "Stack ribs over hips and press overhead without arching.",
  ],
  [
    "Pallof press",
    "Core",
    "Obliques,Core",
    "Resistance band",
    "Press forward while resisting rotation toward the anchor.",
  ],
  [
    "Dead bug",
    "Core",
    "Core,Hip flexors",
    "Bodyweight",
    "Keep the lower back gently on the floor as opposite limbs extend.",
  ],
  [
    "Side plank",
    "Core",
    "Obliques,Hip stabilizers",
    "Bodyweight",
    "Stack the shoulder over the elbow and lift hips into a straight line.",
  ],
  [
    "Farmer carry",
    "Core",
    "Grip,Core",
    "Dumbbells",
    "Walk tall with level shoulders and small controlled steps.",
  ],
  [
    "Copenhagen plank",
    "Hip stability",
    "Adductors,Core",
    "Bench",
    "Support the top knee and lift the lower hip with a short lever first.",
  ],
  [
    "Glute bridge",
    "Hip stability",
    "Glutes",
    "Bodyweight",
    "Drive through heels and raise hips without arching the back.",
  ],
  [
    "Band lateral walk",
    "Hip stability",
    "Glute medius",
    "Resistance band",
    "Keep band tension while taking short sideways steps.",
  ],
  [
    "Face pull",
    "Shoulder stability",
    "Rear delts,Rotator cuff",
    "Resistance band",
    "Pull toward eye level and separate the hands.",
  ],
  [
    "Tibialis raise",
    "Calf and ankle",
    "Tibialis anterior",
    "Wall",
    "Lean against a wall and lift the forefoot with heels down.",
  ],
  [
    "Bird dog",
    "Core",
    "Core,Spinal stabilizers",
    "Bodyweight",
    "Extend opposite limbs without shifting or rotating the pelvis.",
  ],
  [
    "Cable chop",
    "Core",
    "Obliques,Shoulders",
    "Cable machine",
    "Rotate through the upper trunk with the hips controlled.",
  ],
  [
    "Thoracic rotation",
    "Mobility",
    "Upper back",
    "Bodyweight",
    "Rotate the upper back while keeping your pelvis stable.",
  ],
];
export function makeExercises() {
  return Object.fromEntries(
    exData.map(([name, category, muscles, equipment, cue], i) => {
      const e: Exercise = {
        id: `ex-${i}`,
        name,
        category,
        muscles: muscles.split(","),
        equipment,
        difficulty:
          i === 0 || i === 1 || i === 15 ? "Intermediate" : "Foundation",
        technique: [
          `Set up with ${equipment.toLowerCase()} in a stable, comfortable position.`,
          cue,
          "Breathe out through the working phase. Return slowly and reset before the next repetition.",
          "Stop the set when you cannot maintain the same controlled movement.",
        ],
        guidance:
          category === "Mobility"
            ? "2 sets of 6–8 slow repetitions each side"
            : category === "Core"
              ? "3 sets of 8–12 repetitions or 30 seconds"
              : "3 sets of 6–10 repetitions. Rest 90 seconds.",
        mistakes:
          "Rushing the lowering phase, holding tension in the neck, or continuing after technique deteriorates.",
        cues: cue,
        substitutions:
          category === "Squat"
            ? ["Goblet squat", "Step-up"]
            : category === "Hinge"
              ? ["Glute bridge", "Hip thrust"]
              : category === "Core"
                ? ["Dead bug", "Bird dog"]
                : category === "Push"
                  ? ["Push-up", "Overhead press"]
                  : category === "Pull"
                    ? ["Dumbbell row", "Face pull"]
                    : ["Reverse lunge", "Band lateral walk"],
      };
      return [e.id, e];
    }),
  );
}
export const templates = {
  A: ["ex-2", "ex-3", "ex-5", "ex-10", "ex-19", "ex-20"],
  B: ["ex-7", "ex-9", "ex-13", "ex-14", "ex-18", "ex-25"],
};
export function resizedSteps(w: Workout, minutes: number): WorkoutStep[] {
  const factor = minutes / duration(w);
  return w.steps.map((st) => {
    const pool = w.poolLength || 25;
    const meters =
      w.sport === "Swimming" && st.distance > 0
        ? Math.max(pool, Math.floor((st.distance * factor) / pool) * pool)
        : st.distance;
    return {
      ...st,
      id: uid(),
      distance: meters,
      minutes:
        w.sport === "Swimming" && st.distance > 0
          ? (st.minutes * meters) / st.distance
          : st.minutes * factor,
      rest: st.rest * factor,
    };
  });
}
export function generatePlan(
  athlete: Athlete,
  library: Record<string, Workout>,
  start = monday(),
): { plan: TrainingPlan; sessions: PlannedSession[]; workouts: Workout[] } {
  const p = athlete.preferences;
  const baseline = Math.max(1, p.baseline);
  const ceiling = Math.max(1, p.weeklyHours);
  const weeks = [
    Math.min(baseline, ceiling),
    Math.min(baseline * 1.05, ceiling),
    Math.min(baseline * 1.1, ceiling),
    Math.min(baseline * 0.8, ceiling),
  ].map((n) => Math.round(n * 60));
  const available = p.availableDays.filter((d) => d !== p.restDay);
  const sessions: PlannedSession[] = [];
  const workouts: Workout[] = [];
  for (let week = 0; week < 4; week++) {
    const allocations: {
      day: number;
      sport: Sport;
      weight: number;
      index: number;
    }[] = [];
    for (const day of available) {
      const sport: Sport =
        day === p.longRide
          ? "Cycling"
          : day === p.longRun
            ? "Running"
            : p.swimDays.includes(day)
              ? "Swimming"
              : day % 2
                ? "Running"
                : "Cycling";
      allocations.push({
        day,
        sport,
        weight: day === p.longRide ? 2.1 : day === p.longRun ? 1.5 : 1,
        index: day === p.longRide || day === p.longRun ? 1 : 0,
      });
    }
    const candidates = available.filter(
      (d) => d !== p.longRide && d !== p.longRun,
    );
    const strDays: number[] = [];
    while (strDays.length < Math.min(p.strengthSessions, candidates.length)) {
      const score = (d: number) =>
        ([(d + 1) % 7].some((next) => next === p.longRide || next === p.longRun)
          ? 20
          : 0) +
        (strDays.some((other) => Math.abs(other - d) < 2) ? 10 : 0) +
        d * 0.01;
      const day = candidates
        .filter((d) => !strDays.includes(d))
        .sort((a, b) => score(a) - score(b))[0];
      strDays.push(day);
    }
    if (p.doubleDays)
      strDays.forEach((day) =>
        allocations.push({ day, sport: "Strength", weight: 0.7, index: 0 }),
      );
    else
      strDays.forEach((day) => {
        const a = allocations.find((a) => a.day === day);
        if (a) {
          a.sport = "Strength";
          a.weight = 0.7;
        }
      });

    for (const a of allocations) {
      const id = uid();
      const strengthCount = allocations.filter(
        (a) => a.sport === "Strength",
      ).length;
      const strengthMinutes = Math.min(
        45,
        Math.floor((weeks[week] * 0.3) / Math.max(1, strengthCount)),
      );
      const enduranceWeight = allocations
        .filter((a) => a.sport !== "Strength")
        .reduce((n, a) => n + a.weight, 0);
      const mins =
        a.sport === "Strength"
          ? Math.max(5, strengthMinutes)
          : Math.max(
              5,
              Math.round(
                ((weeks[week] - strengthMinutes * strengthCount) * a.weight) /
                  Math.max(0.1, enduranceWeight),
              ),
            );
      const source =
        library[`${a.sport.toLowerCase()}-${a.index}`] ||
        Object.values(library).find((w) => w.sport === a.sport)!;
      if (!source) continue;
      const w: Workout = {
        ...source,
        id,
        strengthTemplateId:
          a.sport === "Strength"
            ? strDays.indexOf(a.day) === 0
              ? "A"
              : "B"
            : undefined,
        steps: resizedSteps(source, mins),
        title:
          a.sport === "Strength"
            ? `Strength ${strDays.indexOf(a.day) === 0 ? "A" : "B"} · endurance support`
            : source.title,
      };
      workouts.push(w);
      sessions.push({
        id: uid(),
        date: addDays(start, week * 7 + a.day),
        workoutId: id,
        status: "planned",
        notes: "",
      });
    }
  }
  const actualWeeks = weeks.map((capacity, i) => {
    const ids = new Set(
      sessions
        .filter(
          (s) =>
            s.date >= addDays(start, i * 7) &&
            s.date < addDays(start, (i + 1) * 7),
        )
        .map((s) => s.workoutId),
    );
    const ws = workouts.filter((w) => ids.has(w.id));
    const total = ws.reduce((n, w) => n + duration(w), 0);
    if (total > capacity) {
      const adjustable = ws.filter((w) => w.sport !== "Swimming").at(-1);
      if (adjustable)
        adjustable.steps = resizedSteps(
          adjustable,
          Math.max(1, duration(adjustable) - (total - capacity)),
        );
    }
    return ws.reduce((n, w) => n + duration(w), 0);
  });
  return {
    plan: {
      id: uid(),
      phase: "Base",
      start,
      weeks: actualWeeks,
      capacityMinutes: weeks,
      objective: athlete.raceDate
        ? `${athlete.goal} · ${athlete.raceDate}`
        : "Rolling base-building",
      sessionIds: sessions.map((s) => s.id),
    },
    sessions,
    workouts,
  };
}
export function seed(): Database {
  const workouts = makeLibrary();
  for (let i = 0; i < 30; i++) {
    const ex = exData[i];
    const id = `strength-${i}`;
    workouts[id] = {
      id,
      title:
        i === 0
          ? "Strength A — Lower body & core"
          : i === 1
            ? "Strength B — Full body & stability"
            : `${ex[0]} · endurance support`,
      sport: "Strength",
      description: `Develop ${ex[2].toLowerCase()} strength to support endurance training. ${ex[4]}`,
      objective: "Strength & stability",
      difficulty: "Foundation",
      equipment: [ex[3]],
      steps: [
        step("Movement preparation", 5, 1),
        step(ex[0] + " · 3 × 8 controlled reps", 30, 2),
        step("Mobility and reset", 8, 1),
      ],
      notes:
        "Use a load that leaves 2–3 repetitions in reserve. Rest 90 seconds between sets.",
      indoor: true,
    };
  }
  const athlete: Athlete = {
    id: "demo-athlete",
    name: "Alex",
    age: "25–34",
    experience: "Intermediate",
    primarySport: "Triathlon",
    goal: "Ironman 70.3",
    raceDate: "",
    preferences: {
      units: "Metric",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weeklyHours: 12,
      baseline: 8.5,
      availableDays: [0, 1, 2, 3, 4, 5, 6],
      longRide: 5,
      longRun: 6,
      restDay: 0,
      swimDays: [1, 3],
      doubleDays: true,
      strengthSessions: 2,
      strengthLocation: "Gym",
      strengthEquipment: "Dumbbells, bands, barbell",
      strengthExperience: "Intermediate",
      exercisePreferences: "Compound movements and stability",
      diet: "No preference",
      restrictions: "",
      products: "",
      nutritionTracking: true,
      reducedMotion: false,
      notifications: true,
      equipment: [
        "Garmin Forerunner 265",
        "Road bike",
        "Smart trainer",
        "25m pool",
        "Gym access",
        "Heart-rate monitor",
      ],
      swimBaseline: 4,
      bikeBaseline: 100,
      runBaseline: 22,
    },
  };
  const db: Database = {
    version: 2,
    strengthWorkouts: {},
    zoneHistory: [],
    onboarded: false,
    athlete,
    zones: { ftp: 240, maxHR: 185, thresholdPace: 300, swimPace: 120 },
    workouts,
    sessions: {},
    activities: {},
    plans: {},
    exercises: makeExercises(),
    strengthLogs: {},
    recovery: {},
    nutrition: {},
    fueling: {},
    recommendations: {},
    revisions: {},
    messages: [],
    integrations: {
      garmin: {
        id: "garmin",
        provider: "Garmin",
        status: "Not connected",
        lastSync: "",
        imports: 0,
      },
      strava: {
        id: "strava",
        provider: "Strava",
        status: "Not connected",
        lastSync: "",
        imports: 0,
      },
    },
    exports: {},
  };
  const start = monday();
  for (let week = 0; week < 12; week++) {
    const factor = [
      0.8, 0.86, 0.94, 0.7, 0.92, 0.98, 1.04, 0.76, 1.02, 1.08, 1.1, 0.94,
    ][week];
    for (let d = 1; d < 7; d++) {
      const sport: Sport =
        d === 1 || d === 3
          ? "Swimming"
          : d === 2 || d === 5
            ? "Cycling"
            : "Running";
      const id = `history-${week}-${d}`;
      const w =
        workouts[`${sport.toLowerCase()}-${d === 5 || d === 6 ? 1 : 0}`];
      const date = addDays(start, -84 + week * 7 + d);
      const mins = Math.round(duration(w) * factor * (d === 6 ? 1.35 : 1));
      const missed = week % 4 === 2 && d === 4;
      db.sessions[id] = {
        id,
        workoutId: w.id,
        date,
        status: missed ? "skipped" : "completed",
        notes: "Seeded demonstration training",
      };
      if (!missed)
        db.activities[id] = {
          id,
          sessionId: id,
          workoutId: w.id,
          date,
          minutes: mins,
          distance: (estimateDistance(w) * mins) / duration(w),
          rpe: d === 5 ? 5 : 4,
          source: "Demo history",
          power: sport === "Cycling" ? 155 + week * 3 : undefined,
          pace:
            sport === "Running"
              ? 365 - week * 2
              : sport === "Swimming"
                ? 135 - week
                : undefined,
          notes: "Fictional demonstration activity",
        };
      if (d === 2 || d === 4) {
        const sid = `history-strength-${week}-${d}`;
        db.sessions[sid] = {
          id: sid,
          workoutId: `strength-${d === 2 ? 0 : 1}`,
          date,
          status: "completed",
          notes: "",
        };
        db.activities[sid] = {
          id: sid,
          sessionId: sid,
          workoutId: `strength-${d === 2 ? 0 : 1}`,
          date,
          minutes: Math.round(40 * factor),
          distance: 0,
          rpe: 5,
          source: "Demo history",
          notes: "Endurance strength",
        };
      }
    }
  }
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today(), -i);
    db.recovery[date] = {
      id: date,
      date,
      sleep: 7.2 + (i % 3) * 0.3,
      quality: 4,
      fatigue: i === 2 ? 3 : 2,
      soreness: 2,
      motivation: 4,
      stress: 2,
      readiness: i === 2 ? 3 : 4,
      notes: "Demo check-in",
    };
  }
  for (const a of Object.values(db.activities).filter(
    (a) => workouts[a.workoutId].sport === "Strength",
  )) {
    const template = a.workoutId === "strength-0" ? "A" : "B";
    const id = `log-${a.id}`;
    const progression = Math.floor(
      (new Date(a.date + "T12:00:00").getTime() -
        new Date(addDays(start, -84) + "T12:00:00").getTime()) /
        604800000,
    );
    db.strengthLogs[id] = {
      id,
      date: a.date,
      template,
      notes: "Fictional demonstration strength history",
      completed: true,
      sets: templates[template].flatMap((exerciseId, exIndex) =>
        Array.from({ length: 3 }, (_, set) => ({
          id: `${id}-${exerciseId}-${set}`,
          sessionId: id,
          exerciseId,
          reps: 8,
          weight: exIndex > 3 ? 0 : 12 + progression * 0.5 + exIndex * 2,
          rpe: 6,
          done: true,
        })),
      ),
    };
  }
  const plan = generatePlan(athlete, workouts);
  plan.workouts.forEach((w) => (db.workouts[w.id] = w));
  plan.sessions.forEach((s) => (db.sessions[s.id] = s));
  db.plans[plan.plan.id] = plan.plan;
  return migrateV2(db);
}
export function completeSession(
  db: Database,
  id: string,
  minutes?: number,
  rpe = 4,
): Database {
  const s = db.sessions[id];
  if (!s || s.status === "completed") return db;
  const w = db.workouts[s.workoutId];
  const activity: CompletedActivity = {
    id: `activity-${id}`,
    sessionId: id,
    workoutId: w.id,
    date: today(),
    minutes: minutes ?? duration(w),
    distance: estimateDistance(w),
    rpe,
    source: "AERON",
    notes: s.notes,
  };
  return {
    ...db,
    sessions: { ...db.sessions, [id]: { ...s, status: "completed" } },
    activities: { ...db.activities, [activity.id]: activity },
  };
}
export function applyPlan(
  db: Database,
  generated: ReturnType<typeof generatePlan>,
): Database {
  const sessions = { ...db.sessions };
  const workouts = { ...db.workouts };
  Object.values(sessions)
    .filter(
      (s) =>
        s.date >= generated.plan.start &&
        s.status === "planned" &&
        !s.coachProtected,
    )
    .forEach((s) => delete sessions[s.id]);
  generated.workouts.forEach((w) => (workouts[w.id] = w));
  generated.sessions.forEach((s) => {
    const alreadyCompleted = Object.values(sessions).some(
      (old) =>
        (old.status === "completed" || old.coachProtected) &&
        old.date === s.date &&
        db.workouts[old.workoutId]?.sport === workouts[s.workoutId]?.sport,
    );
    if (!alreadyCompleted) sessions[s.id] = s;
  });
  return {
    ...db,
    workouts,
    sessions,
    plans: {
      ...db.plans,
      [generated.plan.id]: {
        ...generated.plan,
        sessionIds: generated.sessions
          .filter((s) => !!sessions[s.id])
          .map((s) => s.id),
      },
    },
  };
}
export function importActivity(
  db: Database,
  activity: CompletedActivity,
): Database {
  if (db.activities[activity.id]) return db;
  if (
    !db.workouts[activity.workoutId] ||
    !Number.isFinite(activity.minutes) ||
    activity.minutes <= 0 ||
    !Number.isFinite(activity.distance) ||
    activity.distance < 0
  )
    throw new Error("Invalid activity data.");
  const sport = db.workouts[activity.workoutId].sport;
  const matches = Object.values(db.sessions)
    .filter(
      (s) =>
        s.status === "planned" &&
        s.date === activity.date &&
        db.workouts[s.workoutId].sport === sport &&
        Math.abs(duration(db.workouts[s.workoutId]) - activity.minutes) <=
          Math.max(15, activity.minutes * 0.25),
    )
    .sort(
      (a, b) =>
        Math.abs(duration(db.workouts[a.workoutId]) - activity.minutes) -
        Math.abs(duration(db.workouts[b.workoutId]) - activity.minutes),
    );
  const matched = matches[0];
  const sid = matched?.id || `import-${activity.id}`;
  const session = matched
    ? { ...matched, status: "completed" as const }
    : {
        id: sid,
        date: activity.date,
        workoutId: activity.workoutId,
        status: "completed" as const,
        origin:'import' as const,
        notes: "Imported activity; no matching planned session.",
      };
  return {
    ...db,
    sessions: { ...db.sessions, [sid]: session },
    activities: {
      ...db.activities,
      [activity.id]: { ...activity, sessionId: sid },
    },
  };
}
export function demoImport(db: Database): Database {
  let next = db;
  let count = 0;
  for (let i = 0; i < 3; i++) {
    const id = `strava-demo-${i}`;
    if (next.activities[id]) continue;
    const w = db.workouts[`cycling-${i}`];
    next = importActivity(next, {
      id,
      workoutId: w.id,
      date: addDays(today(), -i - 1),
      minutes: duration(w),
      distance: estimateDistance(w),
      rpe: 4,
      source: "Strava demo",
      power: 180 + i * 5,
      notes:
        "Fictional demo activity · stable provider ID · normalized minutes, km and watts",
    });
    count++;
  }
  return {
    ...next,
    integrations: {
      ...next.integrations,
      strava: {
        ...next.integrations.strava,
        status: "Demo",
        lastSync: new Date().toISOString(),
        imports: next.integrations.strava.imports + count,
      },
    },
  };
}
export function coachReply(
  db: Database,
  prompt: string,
): { text: string; recommendation?: CoachRecommendation } {
  const check = Object.values(db.recovery).sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  const upcoming = Object.values(db.sessions)
    .filter((s) => s.date >= today() && s.status === "planned")
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = Object.values(db.activities)
    .filter((a) => a.date >= addDays(today(), -28))
    .reduce((n, a) => n + a.minutes, 0);
  const fatigued =
    (check &&
      check.date >= addDays(today(), -7) &&
      (check.fatigue >= 4 || check.sleep < 6)) ||
    /fatig|tired|stress/i.test(prompt);
  const short = /45|time|busy|minutes/i.test(prompt);
  const preferred = /tomorrow/i.test(prompt)
    ? upcoming.filter((s) => s.date === addDays(today(), 1))
    : upcoming;
  const s =
    preferred.find((s) => db.workouts[s.workoutId].sport !== "Strength") ||
    upcoming.find((s) => db.workouts[s.workoutId].sport !== "Strength") ||
    upcoming[0];
  if ((fatigued || short) && s) {
    const w = db.workouts[s.workoutId];
    const target = Math.min(duration(w), short ? 45 : duration(w) * 0.65);
    const changed = {
      ...w,
      id: uid(),
      title: `${short ? "Time-adjusted" : "Easy recovery"} · ${w.title}`,
      steps: resizedSteps(w, target).map((st) => ({
        ...st,
        zone: fatigued ? 1 : st.zone,
        target: fatigued ? "Easy conversational effort · RPE 2" : st.target,
      })),
    };
    const rec: CoachRecommendation = {
      id: uid(),
      text: `${short ? "Cap your next session at 45 minutes." : "Reduce your next session and keep the effort easy."} ${check ? `Your latest check-in reported fatigue ${check.fatigue}/5.` : "No recent recovery check-in is available."} Review the change before applying it.`,
      sessionId: s.id,
      before: s,
      after: { ...s, workoutId: changed.id },
      workoutBefore: w,
      workoutAfter: changed,
      status: "pending",
      lifecycle: "Proposed",
      trigger: short
        ? "Reduced time availability"
        : (check?.fatigue || 0) >= 4
          ? "Elevated recorded fatigue"
          : "Athlete-reported fatigue",
      evidence: [
        `Next planned session: ${s.date} · ${Math.round(duration(w))} min`,
        ...(check
          ? [
              `Check-in ${check.date}: fatigue ${check.fatigue}/5, sleep ${check.sleep}h`,
            ]
          : []),
        `Recorded last 28 days: ${Math.round(total)} minutes`,
      ],
      reason: short
        ? "Fit the session within available time while retaining a warm-up and cool-down."
        : "Reduce intensity and volume while the athlete reports elevated fatigue.",
      expectedEffect:
        "Less near-term training demand. Adaptation and readiness are not guaranteed or predicted.",
      confidence:
        "Rule-based suggestion. Subjective check-ins and limited activity data create uncertainty.",
    };
    return { text: rec.text, recommendation: rec };
  }
  const missed = Object.values(db.sessions).filter(
    (s) => s.date >= addDays(today(), -28) && s.status === "skipped",
  ).length;
  return {
    text: `Over the last four weeks you recorded ${hours(total)} across ${Object.values(db.activities).filter((a) => a.date >= addDays(today(), -28)).length} sessions, with ${missed} skipped sessions. ${check ? `Your latest subjective readiness is ${check.readiness}/5 and sleep was ${check.sleep} hours.` : ""} For your ${db.athlete.goal} goal, prioritize repeatable easy volume, two swims when availability allows, and the weekend long ride. ${missed ? "Resume the schedule without trying to make up missed work." : "Keep the current progression conservative."} This is a rule-based Demo Coach using your stored training data.`,
  };
}
export interface CoachAdapter {
  respond(db: Database, prompt: string): Promise<ReturnType<typeof coachReply>>;
}
export function decideRecommendation(
  db: Database,
  id: string,
  action: "accepted" | "rejected" | "undone",
): Database {
  const r = db.recommendations[id];
  if (!r) return db;
  if (
    (action === "accepted" && r.status !== "pending") ||
    (action === "undone" && r.status !== "accepted") || (action==='rejected'&&r.status!=='pending')
  )
    return db;
  const current = db.sessions[r.sessionId];
  const next = {
    ...db,
    recommendations: { ...db.recommendations, [id]: { ...r, status: action } },
  };
  if (action === "rejected")
    return {
      ...next,
      recommendations: {
        ...next.recommendations,
        [id]: { ...r, status: "rejected", lifecycle: "Rejected" },
      },
      revisions: {
        ...db.revisions,
        [`rejected-${id}`]: {
          id: `rejected-${id}`,
          date: new Date().toISOString(),
          recommendationId: id,
          state: "Rejected",
          description: "Rejected proposed adaptation",
        },
      },
    };
  if (!current || current.status === "completed")
    throw new Error(
      "This session has been completed or removed. It cannot be revised.",
    );
  if (
    action === "accepted" &&
    (current.workoutId !== r.before.workoutId || current.date !== r.before.date || current.status!==r.before.status || current.notes!==r.before.notes)
  )
    throw new Error(
      "This proposal is stale. The session changed after it was proposed. Request a new recommendation.",
    );
  if (
    action === "undone" &&
    (current.workoutId !== r.after.workoutId || current.date !== r.after.date || current.status!==r.after.status || current.notes!==r.after.notes)
  )
    throw new Error(
      "The session has changed since this recommendation. Edit it in the calendar.",
    );
  const rev: PlanRevision = {
    id: uid(),
    date: new Date().toISOString(),
    recommendationId: id,
    state: action === "accepted" ? "Applied" : "Reverted",
    description:
      action === "accepted"
        ? "Accepted coach adjustment"
        : "Undid coach adjustment",
  };
  return {
    ...next,
    recommendations: {
      ...db.recommendations,
      [id]: {
        ...r,
        status: action,
        lifecycle: action === "accepted" ? "Applied" : "Reverted",
      },
    },
    workouts: { ...db.workouts, [r.workoutAfter.id]: r.workoutAfter },
    sessions: {
      ...db.sessions,
      [r.sessionId]:
        action === "accepted" ? { ...r.after, coachProtected: true } : r.before,
    },
    revisions: {
      ...db.revisions,
      ...(action === "accepted"
        ? Object.fromEntries(
            ["Validated", "Approved"].map((state) => [
              `${id}-${state}`,
              {
                id: `${id}-${state}`,
                date: rev.date,
                recommendationId: id,
                state: state as RevisionState,
                description:
                  state === "Validated"
                    ? "Proposal validated against current session"
                    : "Athlete approved change",
              },
            ]),
          )
        : {}),
      [rev.id]: rev,
    },
  };
}
export function weeklyData(db: Database, n = 12) {
  const end = monday();
  return Array.from({ length: n }, (_, i) => {
    const start = addDays(end, (i - n + 1) * 7);
    const data: Record<string, number | string> = {
      week: new Date(start + "T12:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      date: start,
    };
    for (const sp of sports)
      data[sp] =
        Math.round(
          Object.values(db.activities)
            .filter(
              (a) =>
                a.date >= start &&
                a.date < addDays(start, 7) &&
                db.workouts[a.workoutId]?.sport === sp,
            )
            .reduce((sum, a) => sum + a.minutes, 0) / 6,
        ) / 10;
    return data;
  });
}
const STORAGE_KEY = "aeron.database.v2";
const LEGACY_KEY = "aeron.database.v1";
let blockedRaw: string | null = null;
let pendingLegacyRaw: string | null = null;
export function validateDatabase(value: unknown): value is Database {
  try {
    if (!value || typeof value !== "object") return false;
    const d = value as Database;
    if (
      d.version !== 2 ||
      !d.athlete?.preferences ||
      !d.zones ||
      !Array.isArray(d.messages) ||
      typeof d.onboarded !== "boolean"
    )
      return false;
    if (
      typeof d.athlete.name !== "string" ||
      typeof d.athlete.goal !== "string" ||
      typeof d.athlete.raceDate !== "string"
    )
      return false;
    const p = d.athlete.preferences;
    if (
      !Array.isArray(p.equipment) ||
      !Array.isArray(p.availableDays) ||
      !Array.isArray(p.swimDays) ||
      !Number.isFinite(p.baseline) ||
      p.baseline < 1 ||
      !Number.isFinite(p.weeklyHours) ||
      p.weeklyHours < 1 ||
      !["Metric", "Imperial"].includes(p.units) ||
      typeof p.timezone !== "string"
    )
      return false;
    try {
      Intl.DateTimeFormat(undefined, { timeZone: p.timezone });
    } catch {
      return false;
    }
    for (const key of [
      "workouts",
      "sessions",
      "activities",
      "plans",
      "exercises",
      "strengthLogs",
      "recovery",
      "nutrition",
      "fueling",
      "recommendations",
      "revisions",
      "integrations",
      "exports",
    ] as const)
      if (!d[key] || typeof d[key] !== "object" || Array.isArray(d[key]))
        return false;
    if (
      !d.strengthWorkouts ||
      !Array.isArray(d.zoneHistory) ||
      !d.zoneHistory.every((z) => Number.isFinite(z.ftp) && z.ftp > 0)
    )
      return false;
    if (
      !Object.values(d.exercises).every(
        (e) =>
          typeof e.name === "string" &&
          Array.isArray(e.muscles) &&
          Array.isArray(e.technique),
      )
    )
      return false;
    if (
      !Object.values(d.strengthWorkouts).every(
        (w) =>
          typeof w.name === "string" &&
          Number.isFinite(w.minutes) &&
          w.minutes > 0 &&
          Array.isArray(w.entries) &&
          w.entries.every(
            (e) =>
              !!d.exercises[e.exerciseId] &&
              Number.isInteger(e.sets) &&
              e.sets > 0 &&
              Number.isFinite(e.weight) &&
              e.weight >= 0,
          ),
      )
    )
      return false;
    if (
      !Object.values(d.strengthLogs).every(
        (l) =>
          Array.isArray(l.sets) &&
          !!d.sessions[l.sessionId || ""] &&
          l.sets.every(
            (s) =>
              !!d.exercises[s.exerciseId] &&
              Number.isFinite(s.weight) &&
              s.weight >= 0 &&
              Number.isFinite(s.reps) &&
              s.reps >= 0 &&
              Number.isFinite(s.rpe) &&
              s.rpe >= 1 &&
              s.rpe <= 10,
          ),
      )
    )
      return false;
    if (
      !d.integrations.garmin ||
      !d.integrations.strava ||
      Object.keys(d.workouts).length === 0
    )
      return false;
    return (
      Object.values(d.sessions).every(
        (s) =>
          !!d.workouts[s.workoutId] &&
          /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
          ["planned", "completed", "skipped"].includes(s.status),
      ) &&
      Object.values(d.activities).every(
        (a) =>
          !!d.workouts[a.workoutId] &&
          Number.isFinite(a.minutes) &&
          a.minutes >= 0,
      ) &&
      Object.values(d.workouts).every(
        (w) =>
          typeof w.title === "string" &&
          sports.includes(w.sport) &&
          Array.isArray(w.steps) &&
          w.steps.length > 0 &&
          w.steps.every(
            (s) =>
              Number.isFinite(s.minutes) &&
              s.minutes > 0 &&
              Number.isInteger(s.reps) &&
              s.reps > 0 &&
              s.reps <= 100 &&
              Number.isFinite(s.distance) &&
              s.distance >= 0 &&
              Number.isFinite(s.rest) &&
              s.rest >= 0,
          ),
      )
    );
  } catch {
    return false;
  }
}
export const storage = {
  load(): { data: Database; warning: string } {
    blockedRaw = null;
    pendingLegacyRaw = null;
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const legacy = current ? null : localStorage.getItem(LEGACY_KEY);
      const raw = current || legacy;
      if (!raw) return { data: seed(), warning: "" };
      const parsed = JSON.parse(raw);
      const data = migrateV2(parsed);
      if (!validateDatabase(data))
        throw new Error("Invalid stored relationships or values.");
      if (legacy) pendingLegacyRaw = legacy;
      return {
        data,
        warning: legacy
          ? "Your V1 data was migrated to V2. The original is retained; a backup is created on your next save."
          : "",
      };
    } catch (error) {
      try {
        blockedRaw =
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem(LEGACY_KEY) ||
          "";
      } catch {
        blockedRaw = "";
      }
      return {
        data: seed(),
        warning:
          "Saved data needs recovery. Showing a temporary demo; original data is untouched. Download the original or import a backup in Settings. Saving is blocked until you explicitly replace it.",
      };
    }
  },
  save(data: Database) {
    if (blockedRaw !== null)
      throw new Error(
        "Storage recovery required. Your original data is protected.",
      );
    if (pendingLegacyRaw) {
      if (!localStorage.getItem("aeron.database.v1.backup"))
        localStorage.setItem("aeron.database.v1.backup", pendingLegacyRaw);
      pendingLegacyRaw = null;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  replace(data: Database) {
    if (!validateDatabase(data)) throw new Error("Invalid replacement data.");
    if (blockedRaw !== null)
      localStorage.setItem("aeron.recovery.backup", blockedRaw);
    blockedRaw = null;
    this.save(data);
  },
  original() {
    const raw =
      blockedRaw ??
      localStorage.getItem("aeron.database.v1.backup") ??
      localStorage.getItem(LEGACY_KEY);
    download("aeron-original-data.json", raw || "{}");
  },
  import(text: string) {
    const value = migrateV2(JSON.parse(text));
    if (!validateDatabase(value))
      throw new Error("Invalid AERON backup. No data was replaced.");
    return value;
  },
  export(data: Database) {
    download("aeron-backup.json", data);
  },
};
export function download(name: string, data: unknown) {
  const blob = new Blob(
    [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
    { type: typeof data === "string" ? "text/plain" : "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
