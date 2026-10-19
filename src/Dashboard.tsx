import { lazy, Suspense } from "react";
import { ArrowUpRight, Heart, Sparkles, ArrowRight, Plus } from "lucide-react";
import { useApp, SectionTitle, AeronScene, SportIcon, dateLabel } from "./ui";
import {
  today,
  addDays,
  monday,
  hours,
  colors,
  duration,
  weeklyData,
  formatDistance,
} from "./domain";
import {
  trainingSummary,
  latestCheckin,
  upcomingSessions,
  phaseLabel,
} from "./metrics";
import { SessionRow } from "./SessionRow";
const VolumeChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.VolumeChart })),
);
export function Overview() {
  const { db, go, openWorkout } = useApp();
  const day = today();
  const week = trainingSummary(db);
  const month = trainingSummary(db, addDays(day, -27), day);
  const check = latestCheckin(db);
  const todaySessions = Object.values(db.sessions).filter(
    (s) => !s.archived && s.date === day,
  );
  const upcoming = upcomingSessions(db)
    .filter((s) => s.date > day)
    .slice(0, 4);
  const nextKey =
    upcomingSessions(db).find(
      (s) => duration(db.workouts[s.workoutId]) >= 75,
    ) || upcoming[0];
  const recent = Object.values(db.activities)
    .filter((a) => a.date <= day)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const planned = week.plannedMinutes;
  return (
    <div className="command-center">
      <header className="command-header">
        <div>
          <div className="eyebrow">
            {dateLabel(day)} <span className="status-dot" /> {phaseLabel(db)}
          </div>
          <h1>Good morning, {db.athlete.name}.</h1>
          <p>Here’s your training at a glance.</p>
        </div>
        <div className="command-sculpture">
          <AeronScene />
        </div>
      </header>
      <div className="command-grid">
        <section className="command-today">
          <SectionTitle
            title="Today’s training"
            action={
              <button className="text-link" onClick={() => go("/calendar")}>
                Calendar <ArrowUpRight size={14} />
              </button>
            }
          />
          {todaySessions.length ? (
            todaySessions.map((s) => <SessionRow key={s.id} session={s} />)
          ) : (
            <div className="today-recovery">
              <div className="recovery-symbol">
                <Heart size={24} strokeWidth={1.5} />
              </div>
              <div>
                <span className="eyebrow mint">RECOVERY DAY</span>
                <h2>Rest is part of your training.</h2>
                <p>
                  {check && check.fatigue >= 4
                    ? `Fatigue is ${check.fatigue}/5. Keep today gentle and review your next session.`
                    : "No sessions scheduled. Move gently, eat well, and make room for sleep."}
                </p>
                <button
                  className="text-link mint"
                  onClick={() => go("/recovery")}
                >
                  Record a check-in <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="weekly-command card">
          <div className="section-title">
            <h2>This week</h2>
            <span className="eyebrow">
              {dateLabel(monday())} — {dateLabel(addDays(monday(), 6))}
            </span>
          </div>
          <div className="weekly-volume">
            <strong>
              {(week.completedMinutes / 60).toFixed(1)}
              <span> / {(planned / 60).toFixed(1)} h</span>
            </strong>
            <small>completed / planned</small>
          </div>
          <progress value={week.completedMinutes} max={Math.max(1, planned)} />
          <div className="weekly-context">
            <span>{week.activities.length} completed sessions</span>
            <span>
              {Math.round(Math.max(0, planned - week.completedMinutes))} min
              remaining
            </span>
          </div>
          <div className="inline-readiness">
            <Heart size={16} />
            <div>
              <strong>
                Readiness {check ? `${check.readiness}/5` : "not recorded"}
              </strong>
              <span>
                {check
                  ? `${check.sleep.toFixed(1)}h sleep · fatigue ${check.fatigue}/5 · ${dateLabel(check.date)}`
                  : "A subjective check-in helps you adapt the day."}
              </span>
            </div>
            <button className="text-link" onClick={() => go("/recovery")}>
              Check in <ArrowUpRight size={13} />
            </button>
          </div>
          {nextKey && (
            <button
              className="next-key"
              onClick={() => openWorkout(nextKey.workoutId, nextKey.id)}
            >
              <span className="eyebrow">NEXT KEY SESSION</span>
              <strong>{db.workouts[nextKey.workoutId].title}</strong>
              <span>
                {dateLabel(nextKey.date)} ·{" "}
                {hours(duration(db.workouts[nextKey.workoutId]))}
              </span>
              <ArrowUpRight size={15} />
            </button>
          )}
        </section>
        <section className="command-upcoming">
          <SectionTitle
            title="Coming up"
            action={
              <button className="text-link" onClick={() => openWorkout("new")}>
                <Plus size={14} />
                Add session
              </button>
            }
          />
          {upcoming.length ? (
            upcoming.map((s) => <SessionRow key={s.id} session={s} showDate />)
          ) : (
            <div className="inline-empty">
              Your upcoming schedule is clear. Add a workout or build your next
              training block.
            </div>
          )}
        </section>
        <section className="command-balance card">
          <SectionTitle title="Discipline balance" meta="THIS WEEK" />
          <div className="discipline-bar">
            {week.distribution.map((d) => (
              <i
                key={d.name}
                style={{
                  flex: Math.max(0.01, d.planned),
                  background: colors[d.name],
                }}
              />
            ))}
          </div>
          <div className="discipline-metrics">
            {week.distribution.map((d) => (
              <div key={d.name}>
                <span style={{ color: colors[d.name] }}>
                  <SportIcon sport={d.name} size={15} />
                  {d.name}
                </span>
                <strong>
                  {hours(d.value)} <small>/ {hours(d.planned)}</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="consistency-line">
            <div>
              <span className="eyebrow">28-DAY ADHERENCE</span>
              <strong>
                {month.adherence == null ? "—" : `${month.adherence}%`}
              </strong>
            </div>
            <p>
              {month.done} of {month.due} scheduled sessions completed.
              <br />
              Consistency comes from repeatable work.
            </p>
          </div>
        </section>
        <section className="command-coach">
          <div className="coach-note">
            <Sparkles size={20} />
            <div>
              <span className="eyebrow">DEMO COACH · BASED ON YOUR DATA</span>
              <h3>
                {check && check.fatigue >= 4
                  ? "Give recovery more room."
                  : "Protect your easy volume."}
              </h3>
              <p>
                {check
                  ? `Your ${dateLabel(check.date)} check-in: fatigue ${check.fatigue}/5, sleep ${check.sleep.toFixed(1)}h. `
                  : "No recovery check-in is available. "}
                {month.done}/{month.due} scheduled sessions were completed over
                28 days.{" "}
                {check && check.fatigue >= 4
                  ? "Review a lighter next session before making a change."
                  : "Prioritize your scheduled sessions without making up missed training."}
              </p>
              <button className="text-link lime" onClick={() => go("/coach")}>
                Review training decisions <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </section>
        <section className="command-progression card">
          <SectionTitle
            title="Training progression"
            meta="12-WEEK COMPLETED HOURS"
            action={
              <button className="text-link" onClick={() => go("/analytics")}>
                Analyze <ArrowUpRight size={14} />
              </button>
            }
          />
          <Suspense fallback={<p>Loading volume chart…</p>}>
            <VolumeChart data={weeklyData(db)} compact />
          </Suspense>
          <div className="chart-legend">
            {week.distribution.map((d) => (
              <span key={d.name}>
                <i style={{ background: colors[d.name] }} />
                {d.name}
              </span>
            ))}
          </div>
        </section>
        <section className="command-recent">
          <SectionTitle
            title="Recent activities"
            action={
              <button className="text-link" onClick={() => go("/analytics")}>
                All activity <ArrowUpRight size={14} />
              </button>
            }
          />
          <div className="recent-activity-table">
            {recent.map((a) => {
              const w = db.workouts[a.workoutId];
              return (
                <button
                  key={a.id}
                  onClick={() => openWorkout(w.id, a.sessionId)}
                >
                  <span style={{ color: colors[w.sport] }}>
                    <SportIcon sport={w.sport} size={16} />
                  </span>
                  <div>
                    <strong>{w.title}</strong>
                    <span>
                      {dateLabel(a.date)} · {a.source}
                    </span>
                  </div>
                  <strong>
                    {w.sport === "Strength"
                      ? `${a.minutes} min`
                      : formatDistance(
                          a.distance,
                          db.athlete.preferences.units,
                        )}
                  </strong>
                  <span>{hours(a.minutes)}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
