import { useState, lazy, Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  Clock,
  Flame,
  TrendingUp,
  Sparkles,
  CalendarDays,
  RotateCcw,
  Search,
  Filter,
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
  WorkoutCard,
  AeronScene,
  Field,
  Modal,
  Empty,
  dateLabel,
  SportIcon,
} from "./ui";
import {
  sports,
  colors,
  today,
  monday,
  addDays,
  hours,
  duration,
  weeklyData,
  generatePlan,
  applyPlan,
  type Sport,
  type Athlete,
  estimateDistance,
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
export function Overview() {
  const { db, go, openWorkout } = useApp();
  const day = today();
  const start = monday();
  const sessions = Object.values(db.sessions);
  const activities = Object.values(db.activities);
  const weekSessions = sessions.filter(
    (s) => s.date >= start && s.date < addDays(start, 7),
  );
  const weekActivities = activities.filter(
    (a) => a.date >= start && a.date < addDays(start, 7),
  );
  const planned = weekSessions.reduce(
    (n, s) => n + duration(db.workouts[s.workoutId]),
    0,
  );
  const completed = weekActivities.reduce((n, a) => n + a.minutes, 0);
  const lastWeek = activities
    .filter((a) => a.date >= addDays(start, -7) && a.date < start)
    .reduce((n, a) => n + a.minutes, 0);
  const todaySessions = weekSessions.filter((s) => s.date === day);
  const upcoming = sessions
    .filter((s) => s.date >= day && s.status === "planned")
    .sort((a, b) => a.date.localeCompare(b.date));
  const check = Object.values(db.recovery).sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  const data = weeklyData(db);
  const distribution = sports.map((sp) => ({
    name: sp,
    value: weekSessions
      .filter((s) => db.workouts[s.workoutId].sport === sp)
      .reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0),
  }));
  const recent = activities
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const consistency = Math.round(
    (sessions.filter(
      (s) =>
        s.date < day && s.date >= addDays(day, -28) && s.status === "completed",
    ).length /
      Math.max(
        1,
        sessions.filter((s) => s.date < day && s.date >= addDays(day, -28))
          .length,
      )) *
      100,
  );
  return (
    <>
      <div className="overview-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            YOUR PERSONAL PERFORMANCE SYSTEM
          </div>
          <h1>
            EVERY SESSION
            <br />
            <span>COUNTS.</span>
          </h1>
          <p>Good morning, {db.athlete.name}. Let’s get to work.</p>
        </div>
        <div className="headline-right">
          <span className="system-code">AERON OS / 01.0</span>
          <span className="demo-label">DEMO ENVIRONMENT</span>
        </div>
      </div>
      <div className="hero-card">
        <div className="hero-content">
          <Badge>
            <span className="status-dot" />{" "}
            {Object.values(db.plans).at(-1)?.phase.toUpperCase() || "BASE"}{" "}
            BUILDING · WEEK 01
          </Badge>
          <h2>
            BUILT FOR
            <br />
            THE LONG GAME.
          </h2>
          <p>
            Your training, intelligently aligned.
            <br />A little stronger. A little further. Every day.
          </p>
          <Button onClick={() => go("/plans")}>
            View your training plan <ArrowUpRight size={17} />
          </Button>
          <div className="hero-foot">
            <div>
              <span className="eyebrow">YOUR OBJECTIVE</span>
              <strong>{db.athlete.goal}</strong>
            </div>
            <span className="hero-divider" />
            <div>
              <span className="eyebrow">
                {db.athlete.raceDate ? "RACE COUNTDOWN" : "TRAINING MODE"}
              </span>
              <strong>
                {db.athlete.raceDate
                  ? `${Math.ceil((new Date(db.athlete.raceDate).getTime() - new Date(day).getTime()) / 86400000)} days`
                  : "Rolling base"}
              </strong>
            </div>
          </div>
        </div>
        <div className="hero-sculpture">
          <AeronScene />
          <div className="sculpture-caption">
            <span>01 / 03</span>
            <span>INTELLIGENCE IN MOTION.</span>
            <i />
          </div>
        </div>
        <span className="hero-corner">ADAPT. ENDURE. EVOLVE.</span>
      </div>
      <div className="stats-grid">
        <Stat
          label="WEEKLY VOLUME"
          value={(completed / 60).toFixed(1)}
          unit="/ h"
          sub={`of ${(planned / 60).toFixed(1)}h planned`}
          accent
        >
          <Suspense>
            <Spark values={[3, 4, 3, 5, 5, 6, 4, 7, completed / 60]} />
          </Suspense>
        </Stat>
        <Stat
          label="TRAINING CONSISTENCY"
          value={consistency}
          unit="%"
          sub="Last 28 days"
        >
          <span className="metric-trend">
            <TrendingUp size={13} /> Keep showing up
          </span>
        </Stat>
        <Stat
          label="RECOVERY CHECK-IN"
          value={check?.readiness || "—"}
          unit="/ 5"
          sub="Subjective readiness"
        >
          <button className="text-link mint" onClick={() => go("/recovery")}>
            Check in <ArrowUpRight size={13} />
          </button>
        </Stat>
        <Stat
          label="NEXT KEY SESSION"
          value={
            upcoming[0]
              ? Math.round(duration(db.workouts[upcoming[0].workoutId]))
              : "—"
          }
          unit="min"
          sub={
            upcoming[0]
              ? db.workouts[upcoming[0].workoutId].title
              : "Your calendar is clear"
          }
        >
          <Clock size={16} />
        </Stat>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <SectionTitle
            title="Your next move"
            meta={dateLabel()}
            action={
              <button className="text-link" onClick={() => go("/calendar")}>
                View calendar <ArrowUpRight size={14} />
              </button>
            }
          />
          <div className="today-sessions">
            {todaySessions.length ? (
              todaySessions.map((s) => (
                <WorkoutCard
                  key={s.id}
                  w={db.workouts[s.workoutId]}
                  sessionId={s.id}
                />
              ))
            ) : (
              <Card className="rest-card">
                <div className="rest-icon">
                  <Activity size={24} />
                </div>
                <div>
                  <h3>Recovery is part of the plan.</h3>
                  <p>
                    Today is a rest day. Give your next effort a stronger
                    foundation.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => go("/recovery")}
                >
                  Check in <ArrowRight size={14} />
                </Button>
              </Card>
            )}
            {!todaySessions.length && upcoming[0] && (
              <>
                <div className="eyebrow up-next">
                  UP NEXT · {dateLabel(upcoming[0].date)}
                </div>
                <WorkoutCard
                  w={db.workouts[upcoming[0].workoutId]}
                  sessionId={upcoming[0].id}
                />
              </>
            )}
          </div>
          <Card className="week-card">
            <SectionTitle
              title="This week"
              meta={`${weekSessions.length} SESSIONS`}
              action={
                <button className="text-link" onClick={() => go("/calendar")}>
                  <ArrowUpRight size={16} />
                </button>
              }
            />
            <div className="week-strip">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(start, i);
                const ss = weekSessions.filter((s) => s.date === d);
                return (
                  <button
                    className={`week-day ${d === day ? "today" : ""}`}
                    key={d}
                    onClick={() => go(`/calendar?date=${d}`)}
                  >
                    <span>
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i]}
                    </span>
                    <strong>{new Date(d + "T12:00:00").getDate()}</strong>
                    <div className="day-dots">
                      {ss.map((s) => (
                        <i
                          key={s.id}
                          style={{
                            background: colors[db.workouts[s.workoutId].sport],
                          }}
                        />
                      ))}
                    </div>
                    <small>
                      {ss.length
                        ? `${Math.round(ss.reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0))}m`
                        : "Rest"}
                    </small>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="volume-card">
            <SectionTitle
              title="The work adds up"
              meta="12-WEEK TRAINING VOLUME"
              action={
                <button className="text-link" onClick={() => go("/analytics")}>
                  Analytics <ArrowUpRight size={14} />
                </button>
              }
            />
            <Suspense fallback={<p>Loading training history…</p>}>
              <VolumeChart data={data} compact />
            </Suspense>
            <div className="chart-legend">
              {sports.map((sp) => (
                <span key={sp}>
                  <i style={{ background: colors[sp] }} />
                  {sp}
                </span>
              ))}
            </div>
          </Card>
        </div>
        <div className="dashboard-aside">
          <Card className="coach-card">
            <div className="button-row spread">
              <div className="eyebrow">
                <Sparkles size={14} />
                COACH INTELLIGENCE
              </div>
              <span className="tiny-demo">DEMO</span>
            </div>
            <h3>
              {(check?.fatigue || 0) >= 4
                ? "Make room for recovery."
                : "Consistency over intensity."}
            </h3>
            <p>
              {(check?.fatigue || 0) >= 4
                ? `You reported fatigue ${check.fatigue}/5. Keep your next session easy and review the week with your coach.`
                : `You completed ${hours(lastWeek)} last week. Keep your long ride controlled and protect your easy days. Building a base is a long game.`}
            </p>
            <button className="text-link lime" onClick={() => go("/coach")}>
              Talk to your coach <ArrowUpRight size={14} />
            </button>
            <div className="coach-decor" />
          </Card>
          <Card className="distribution-card">
            <SectionTitle title="Balanced by design" meta="THIS WEEK" />
            <div className="donut-wrap">
              <Suspense>
                <DistributionChart data={distribution} />
              </Suspense>
              <div className="donut-center">
                <strong>{(planned / 60).toFixed(1)}</strong>
                <span>HOURS PLANNED</span>
              </div>
            </div>
            <div className="distribution-list">
              {distribution.map((d) => (
                <div key={d.name}>
                  <span>
                    <i style={{ background: colors[d.name as Sport] }} />
                    {d.name}
                  </span>
                  <strong>{hours(d.value)}</strong>
                </div>
              ))}
            </div>
          </Card>
          <div className="brand-quote">
            TRAIN WITH INTENT.<span>THE REST WILL FOLLOW.</span>
            <LogoMark />
          </div>
        </div>
      </div>
      <SectionTitle
        title="Recently in motion"
        meta="COMPLETED ACTIVITIES"
        action={
          <button className="text-link" onClick={() => go("/analytics")}>
            All activity <ArrowUpRight size={14} />
          </button>
        }
      />
      <div className="recent-grid">
        {recent.map((a) => {
          const w = db.workouts[a.workoutId];
          return (
            <button
              key={a.id}
              className="card activity-card"
              onClick={() => openWorkout(w.id, a.sessionId)}
            >
              <div className="button-row spread">
                <span
                  className="sport-label"
                  style={{ color: colors[w.sport] }}
                >
                  <SportIcon sport={w.sport} />
                  {w.sport}
                </span>
                <Check size={14} className="muted" />
              </div>
              <h3>{w.title}</h3>
              <div className="activity-metric">
                {w.sport === "Strength"
                  ? Math.round(a.minutes)
                  : a.distance.toFixed(1)}
                <small>{w.sport === "Strength" ? " min" : " km"}</small>
              </div>
              <div className="activity-footer">
                <span>{dateLabel(a.date)}</span>
                <span>{hours(a.minutes)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
function LogoMark() {
  return (
    <svg viewBox="0 0 60 35" width="50" aria-hidden="true">
      <path
        d="m3 30 25-25 26 25M17 30 28 17 40 30"
        stroke="#D6FF43"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
}
export function Calendar() {
  const { db, setDb, toast, openWorkout } = useApp();
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  const [date, setDate] = useState(query.get("date") || today());
  const [view, setView] = useState("Week");
  const [filter, setFilter] = useState("All disciplines");
  const start = view === "Week" ? monday(date) : date.slice(0, 7) + "-01";
  const gridStart = view === "Week" ? start : monday(start);
  const count = view === "Week" ? 7 : 42;
  const ss = Object.values(db.sessions).filter(
    (s) =>
      filter === "All disciplines" || db.workouts[s.workoutId].sport === filter,
  );
  const visible = ss.filter(
    (s) => s.date >= gridStart && s.date < addDays(gridStart, count),
  );
  const total = visible.reduce(
    (n, s) => n + duration(db.workouts[s.workoutId]),
    0,
  );
  function move(id: string, d: string) {
    setDb((old) => ({
      ...old,
      sessions: { ...old.sessions, [id]: { ...old.sessions[id], date: d } },
    }));
    toast("Workout rescheduled.");
  }
  return (
    <>
      <PageTitle
        eyebrow="MAKE ROOM FOR THE WORK"
        title="TRAINING CALENDAR."
        description="A clear view of what’s ahead. The flexibility to make it yours."
        action={
          <Button onClick={() => openWorkout("new")}>
            <Plus size={16} />
            Add workout
          </Button>
        }
      />
      <div className="calendar-toolbar">
        <div className="button-row">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous period"
            onClick={() => {
              if (view === "Week") setDate(addDays(date, -7));
              else {
                const d = new Date(date + "T12:00:00");
                d.setDate(1);
                d.setMonth(d.getMonth() - 1);
                setDate(
                  d.getFullYear() +
                    "-" +
                    String(d.getMonth() + 1).padStart(2, "0") +
                    "-01",
                );
              }
            }}
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next period"
            onClick={() => {
              if (view === "Week") setDate(addDays(date, 7));
              else {
                const d = new Date(date + "T12:00:00");
                d.setDate(1);
                d.setMonth(d.getMonth() + 1);
                setDate(
                  d.getFullYear() +
                    "-" +
                    String(d.getMonth() + 1).padStart(2, "0") +
                    "-01",
                );
              }
            }}
          >
            <ChevronRight size={17} />
          </Button>
          <h3>
            {new Date(start + "T12:00:00").toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <Button size="sm" variant="ghost" onClick={() => setDate(today())}>
            Today
          </Button>
        </div>
        <div className="button-row">
          <select
            aria-label="Filter discipline"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All disciplines</option>
            {sports.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="segmented">
            {["Week", "Month"].map((s) => (
              <button
                key={s}
                className={view === s ? "active" : ""}
                onClick={() => setView(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="calendar-summary">
        <span>
          <i className="status-dot" />
          {visible.length} sessions
        </span>
        <span>{hours(total)} scheduled</span>
        <span>
          {visible.filter((s) => s.status === "completed").length} completed
        </span>
      </div>
      <div className={`calendar-grid ${view === "Month" ? "month" : ""}`}>
        {Array.from({ length: count }, (_, i) => {
          const d = addDays(gridStart, i);
          const day = ss.filter((s) => s.date === d);
          return (
            <div
              className={`calendar-cell ${d === today() ? "is-today" : ""}`}
              key={d}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("aeron/session");
                if (db.sessions[id] && db.sessions[id].status === "planned")
                  move(id, d);
              }}
            >
              <div className="calendar-date">
                <span>
                  {new Date(d + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </span>
                <strong>{new Date(d + "T12:00:00").getDate()}</strong>
                <button
                  aria-label={`Add workout on ${d}`}
                  onClick={() => {
                    openWorkout("new", undefined, d);
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              {day.length > 2 && (
                <div className="conflict">Busy day · check spacing</div>
              )}
              {day.map((s) => {
                const w = db.workouts[s.workoutId];
                return (
                  <button
                    draggable={s.status === "planned"}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("aeron/session", s.id)
                    }
                    className={`calendar-workout ${s.status}`}
                    key={s.id}
                    style={
                      { "--sport": colors[w.sport] } as React.CSSProperties
                    }
                    onClick={() => openWorkout(w.id, s.id)}
                  >
                    <div>
                      <SportIcon sport={w.sport} size={14} />
                      <span>{w.sport}</span>
                      {s.status === "completed" && <Check size={12} />}
                    </div>
                    <h4>{w.title}</h4>
                    <p>
                      {Math.round(duration(w))} min · Z
                      {Math.max(...w.steps.map((st) => st.zone))}
                    </p>
                  </button>
                );
              })}
              {!day.length && <div className="rest-label">REST & RESET</div>}
              <div className="day-total">
                {day.length
                  ? hours(
                      day.reduce(
                        (n, s) => n + duration(db.workouts[s.workoutId]),
                        0,
                      ),
                    )
                  : ""}
              </div>
            </div>
          );
        })}
      </div>
      <p className="helper">
        <CalendarDays size={14} /> Drag planned workouts between days on
        desktop. Open any session to change its date on mobile.
      </p>
    </>
  );
}
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
  const p = athlete.preferences;
  const setP = (patch: Partial<typeof p>) =>
    setAthlete({ ...athlete, preferences: { ...p, ...patch } });
  return (
    <>
      <PageTitle
        eyebrow="BUILT FOR THE LONG GAME"
        title="PROGRESS IS A PROCESS."
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
            {(plan?.weeks || []).map((v, i) => (
              <div key={i}>
                <span className="eyebrow">
                  WEEK {i + 1}
                  {i === 3 ? " · RECOVERY" : ""}
                </span>
                <div>
                  <i
                    style={{
                      width: `${(v / Math.max(...(plan?.weeks || [1]))) * 100}%`,
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
        title={sport ? `${sport.toUpperCase()}.` : "THE WORKOUT LIBRARY."}
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
            <h2>
              {sport === "Running"
                ? "FIND YOUR NEXT GEAR."
                : sport === "Cycling"
                  ? "POWER WITH PURPOSE."
                  : "MOVE THROUGH WATER."}
            </h2>
            <p>
              {sport === "Cycling"
                ? `FTP ${db.zones.ftp} W · Zone 2 ${Math.round(db.zones.ftp * 0.6)}–${Math.round(db.zones.ftp * 0.75)} W`
                : sport === "Running"
                  ? `Threshold pace ${Math.floor(db.zones.thresholdPace / 60)}:${String(db.zones.thresholdPace % 60).padStart(2, "0")} /km · Max HR ${db.zones.maxHR}`
                  : `25m pool · CSS ${Math.floor(db.zones.swimPace / 60)}:${String(db.zones.swimPace % 60).padStart(2, "0")} /100m`}
            </p>
          </div>
          <AeronScene variant="orb" sport={sport} />
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
