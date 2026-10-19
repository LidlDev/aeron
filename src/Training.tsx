import { useState, lazy } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  TrendingUp,
  RotateCcw,
  Search,
  Flag,
  Activity,
} from "lucide-react";
import {
  useApp,
  PageTitle,
  Card,
  SectionTitle,
  Button,
  Stat,
  Badge,
  AeronScene,
  Field,
  Modal,
  Empty,
  dateLabel,
} from "./ui";
import {
  sports,
  colors,
  today,
  addDays,
  hours,
  duration,
  generatePlan,
  applyPlan,
  type Sport,
  type Athlete,
} from "./domain";
import { IntervalTimeline } from "./IntervalTimeline";
const VolumeChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.VolumeChart })),
);
const DistributionChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.DistributionChart })),
);
const Spark = lazy(() =>
  import("./Charts").then((m) => ({ default: m.Spark })),
);
export function Plans() {
  const { db, setDb, toast, openWorkout } = useApp();
  const [athlete, setAthlete] = useState<Athlete>(() =>
    structuredClone(db.athlete),
  );
  const [preview, setPreview] = useState<ReturnType<
    typeof generatePlan
  > | null>(null);
  const [phase, setPhase] = useState<string>(
    () => Object.values(db.plans).at(-1)?.phase || "Base",
  );
  const plan = Object.values(db.plans).at(-1);
  const displayedWeeks = plan
    ? Array.from({ length: 4 }, (_, i) =>
        Object.values(db.sessions)
          .filter(
            (s) =>
              !s.archived &&
              s.origin !== "import" &&
              s.date >= addDays(plan.start, i * 7) &&
              s.date < addDays(plan.start, (i + 1) * 7),
          )
          .reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0),
      )
    : [];
  const p = athlete.preferences;
  const setP = (patch: Partial<typeof p>) =>
    setAthlete({ ...athlete, preferences: { ...p, ...patch } });
  return (
    <>
      <PageTitle
        eyebrow="BUILT FOR THE LONG GAME"
        title="Training plan"
        description="Purposeful blocks. Sustainable progression. Room to adapt."
      />
      <div className="plan-hero card">
        <div>
          <Badge>{phase.toUpperCase()} PHASE</Badge>
          <h2>
            {db.athlete.goal}
            <span>
              Start where you are.
              <br />
              Build what comes next.
            </span>
          </h2>
          <p>
            {db.athlete.raceDate
              ? `Target race · ${db.athlete.raceDate}`
              : "Rolling base-building · No race date selected"}
          </p>
        </div>
        <AeronScene variant="journey" />
        <div className="race-distances">
          <span>
            <b className="cyan">1.9</b>KM SWIM
          </span>
          <span>
            <b className="lime">90</b>KM BIKE
          </span>
          <span>
            <b className="coral">21.1</b>KM RUN
          </span>
        </div>
      </div>
      <div className="phase-list">
        {["Base", "Build", "Peak", "Taper", "Recovery"].map((s) => (
          <button
            className={phase === s ? "active" : ""}
            onClick={() => {
              setPhase(s);
              if (plan)
                setDb((d) => ({
                  ...d,
                  plans: {
                    ...d.plans,
                    [plan.id]: { ...plan, phase: s as typeof plan.phase },
                  },
                }));
            }}
            key={s}
          >
            {s}
            <ArrowRight size={13} />
          </button>
        ))}
      </div>
      <div className="two-col">
        <Card>
          <SectionTitle
            title="Your four-week block"
            meta="CONTROLLED PROGRESSION"
          />
          <div className="block-bars">
            {displayedWeeks.map((v, i) => (
              <div key={i}>
                <span className="eyebrow">
                  WEEK {i + 1}
                  {i === 3 ? " · RECOVERY" : ""}
                </span>
                <div>
                  <i
                    style={{
                      width: `${(v / Math.max(...displayedWeeks, 1)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{hours(v)}</strong>
              </div>
            ))}
          </div>
          <p className="helper">
            Starting volume is capped by your recent baseline. Weeks 2 and 3
            increase by 5% and 10% of baseline; week 4 reduces to 80%. Your
            available hours are a ceiling.
          </p>
          <SectionTitle title="Key priorities" />
          <div className="priority-list">
            <p>
              <WavesIcon /> Two purposeful swim sessions when your schedule
              allows.
            </p>
            <p>
              <TrendingUp size={17} />
              Aerobic volume before high-intensity work.
            </p>
            <p>
              <Flag size={17} />
              Weekend long sessions. Consistency throughout.
            </p>
          </div>
        </Card>
        <Card>
          <SectionTitle title="Tune your training" meta="PLAN BUILDER" />
          <div className="form-grid">
            <Field label="Event objective">
              <select
                value={athlete.goal}
                onChange={(e) =>
                  setAthlete({ ...athlete, goal: e.target.value })
                }
              >
                {[
                  "Sprint triathlon",
                  "Olympic triathlon",
                  "Ironman 70.3",
                  "Full Ironman",
                  "General endurance fitness",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Race date (optional)">
              <input
                type="date"
                value={athlete.raceDate}
                min={today()}
                onChange={(e) =>
                  setAthlete({ ...athlete, raceDate: e.target.value })
                }
              />
            </Field>
            <Field label="Weekly availability (hours)">
              <input
                type="number"
                min="1"
                max="30"
                value={p.weeklyHours}
                onChange={(e) => setP({ weeklyHours: +e.target.value })}
              />
            </Field>
            <Field label="Recent baseline (hours/week)">
              <input
                type="number"
                min="1"
                max="30"
                step=".5"
                value={p.baseline}
                onChange={(e) => setP({ baseline: +e.target.value })}
              />
            </Field>
            <Field label="Strength sessions">
              <select
                value={p.strengthSessions}
                onChange={(e) => setP({ strengthSessions: +e.target.value })}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            {(["longRide", "longRun", "restDay"] as const).map((k) => (
              <Field
                key={k}
                label={
                  k === "longRide"
                    ? "Long ride day"
                    : k === "longRun"
                      ? "Long run day"
                      : "Rest day"
                }
              >
                <select
                  value={p[k]}
                  onChange={(e) => setP({ [k]: +e.target.value })}
                >
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <Field label="Available days">
            <div className="day-picker">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]} available`}
                  aria-pressed={p.availableDays.includes(i)}
                  className={p.availableDays.includes(i) ? "selected" : ""}
                  onClick={() =>
                    setP({
                      availableDays: p.availableDays.includes(i)
                        ? p.availableDays.filter((d) => d !== i)
                        : [...p.availableDays, i],
                    })
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Button
            disabled={
              p.availableDays.filter((d) => d !== p.restDay).length === 0 ||
              p.baseline <= 0 ||
              p.weeklyHours <= 0
            }
            onClick={() => setPreview(generatePlan(athlete, db.workouts))}
          >
            <RotateCcw size={16} />
            Preview regenerated plan
          </Button>
          <p className="helper">
            Completed sessions and activity history are preserved.
          </p>
        </Card>
      </div>
      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title="Review your next block"
          description="Only upcoming planned sessions will be replaced."
          wide
        >
          <div className="dialog-body">
            <div className="stats-grid">
              {preview.plan.weeks.map((m, i) => (
                <Stat
                  key={i}
                  label={`WEEK ${i + 1}`}
                  value={(m / 60).toFixed(1)}
                  unit="h"
                />
              ))}
            </div>
            {preview.sessions.slice(0, 8).map((s) => (
              <div className="preview-session" key={s.id}>
                <span>{dateLabel(s.date)}</span>
                <Badge
                  sport={
                    preview.workouts.find((w) => w.id === s.workoutId)!.sport
                  }
                >
                  {preview.workouts.find((w) => w.id === s.workoutId)!.title}
                </Badge>
                <span>
                  {hours(
                    duration(
                      preview.workouts.find((w) => w.id === s.workoutId)!,
                    ),
                  )}
                </span>
              </div>
            ))}
            <p className="helper">
              {preview.sessions.length} total sessions ·{" "}
              {preview.plan.objective}
            </p>
            <Button
              onClick={() => {
                setDb((d) => applyPlan({ ...d, athlete }, preview));
                setPreview(null);
                toast("Four-week plan saved. Completed history preserved.");
              }}
            >
              Apply training block <Check size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function WavesIcon() {
  return <Activity size={17} />;
}
export function Library({ sport }: { sport?: Sport }) {
  const { db, openWorkout } = useApp();
  const [q, setQ] = useState("");
  const [discipline, setDiscipline] = useState(sport || "All");
  const [intensity, setIntensity] = useState("All");
  const [zone, setZone] = useState("All");
  const [length, setLength] = useState("All");
  const [objective, setObjective] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const workouts = Object.values(db.workouts).filter(
    (w) =>
      w.custom ||
      w.id.startsWith("running-") ||
      w.id.startsWith("cycling-") ||
      w.id.startsWith("swimming-") ||
      w.id.startsWith("strength-") ||
      !Object.values(db.sessions).some((s) => s.workoutId === w.id),
  );
  const filtered = workouts.filter(
    (w) =>
      (discipline === "All" || w.sport === discipline) &&
      w.title.toLowerCase().includes(q.toLowerCase()) &&
      (intensity === "All" || w.difficulty === intensity) &&
      (zone === "All" ||
        (zone === "Easy"
          ? Math.max(...w.steps.map((s) => s.zone)) <= 2
          : zone === "Moderate"
            ? Math.max(...w.steps.map((s) => s.zone)) === 3
            : Math.max(...w.steps.map((s) => s.zone)) >= 4)) &&
      (length === "All" ||
        (length === "Under 45 min" ? duration(w) < 45 : duration(w) >= 45)) &&
      (objective === "All" || w.objective === objective) &&
      (equipment === "All" || w.equipment.includes(equipment)),
  );
  return (
    <>
      <PageTitle
        eyebrow={
          sport
            ? `${sport.toUpperCase()} / PERFORMANCE STUDIO`
            : "PURPOSE IN EVERY SESSION"
        }
        title={sport || "Workout library"}
        description={
          sport
            ? {
                Running:
                  "Find your rhythm. Build your engine. Run with intent.",
                Cycling:
                  "Sustainable power. Purposeful miles. Your next level.",
                Swimming:
                  "Efficiency before effort. Confidence in every stroke.",
                Strength: "Build the foundation that carries you further.",
              }[sport]
            : "Structured sessions for every discipline, every phase, every ambition."
        }
        action={
          <Button onClick={() => openWorkout("new")}>
            <Plus size={16} />
            Build workout
          </Button>
        }
      />
      {sport && (
        <div className="sport-header card">
          <div>
            <Badge sport={sport}>
              <SportIconMini sport={sport} />
              {sport.toUpperCase()} SYSTEM
            </Badge>
            <p>
              {sport === "Cycling"
                ? `FTP ${db.zones.ftp} W · Zone 2 ${Math.round(db.zones.ftp * 0.6)}–${Math.round(db.zones.ftp * 0.75)} W`
                : sport === "Running"
                  ? `Threshold pace ${Math.floor(db.zones.thresholdPace / 60)}:${String(db.zones.thresholdPace % 60).padStart(2, "0")} /km · Max HR ${db.zones.maxHR}`
                  : `25m pool · CSS ${Math.floor(db.zones.swimPace / 60)}:${String(db.zones.swimPace % 60).padStart(2, "0")} /100m`}
            </p>
          </div>
        </div>
      )}
      <div className="filters">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search workouts"
            placeholder="Find your next session…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {!sport && (
          <select
            aria-label="Discipline filter"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          >
            <option value="All">All disciplines</option>
            {sports.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        <select
          aria-label="Duration filter"
          value={length}
          onChange={(e) => setLength(e.target.value)}
        >
          <option value="All">Any duration</option>
          <option>Under 45 min</option>
          <option>45 min or longer</option>
        </select>
        <select
          aria-label="Difficulty filter"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value)}
        >
          <option value="All">All levels</option>
          <option>Foundation</option>
          <option>Intermediate</option>
        </select>
        <select
          aria-label="Intensity filter"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="All">Any intensity</option>
          <option value="Easy">Easy · Z1–2</option>
          <option value="Moderate">Moderate · Z3</option>
          <option value="Hard">Hard · Z4–5</option>
        </select>
        <select
          aria-label="Objective filter"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        >
          <option value="All">All objectives</option>
          {[...new Set(workouts.map((w) => w.objective))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Equipment filter"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        >
          <option value="All">All equipment</option>
          {[...new Set(workouts.flatMap((w) => w.equipment))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <SectionTitle
        title={sport ? "Your session collection" : "The complete collection"}
        meta={`${filtered.length} STRUCTURED WORKOUTS`}
      />
      <div className="library-grid">
        {filtered.map((w) => (
          <Card key={w.id} className="library-card">
            <div className="button-row spread">
              <Badge sport={w.sport}>{w.sport}</Badge>
              <span className="eyebrow">{w.difficulty}</span>
            </div>
            <h3>{w.title}</h3>
            <p>{w.description}</p>
            <IntervalTimeline w={w} />
            <div className="library-card-foot">
              <span className="mono">
                {Math.round(duration(w))} MIN{" "}
                {w.sport === "Swimming"
                  ? `/ ${w.steps.reduce((n, s) => n + s.distance * s.reps, 0)} M`
                  : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openWorkout(w.id)}
              >
                Explore session <ArrowUpRight size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!filtered.length && (
        <Empty
          title="No matching sessions"
          description="Try a different search or create a session of your own."
          action={
            <Button
              onClick={() => {
                setQ("");
                setDiscipline(sport || "All");
                setLength("All");
                setIntensity("All");
                setZone("All");
                setEquipment("All");
                setObjective("All");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </>
  );
}
function SportIconMini({ sport }: { sport: Sport }) {
  return <Activity size={13} style={{ color: colors[sport] }} />;
}
