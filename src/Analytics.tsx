import { useState, lazy, Suspense } from "react";
import {
  useApp,
  PageTitle,
  Card,
  SectionTitle,
  Field,
  Empty,
  AeronScene,
} from "./ui";
import {
  today,
  addDays,
  monday,
  hours,
  duration,
  colors,
  sports,
  weeklyData,
  type Sport,
} from "./domain";
import { trainingSummary, sportProgress, latestCheckin } from "./metrics";
import { exerciseHistory } from "./strength-core";
import { timeInZone } from "./workout-math";
const TrendChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.TrendChart })),
);
const VolumeChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.VolumeChart })),
);
const HoursChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.HoursComparisonChart })),
);
function ChartPanel({
  title,
  unit,
  context,
  data,
  keys,
  color,
}: {
  title: string;
  unit: string;
  context: string;
  data: Record<string, number | string>[];
  keys: string[];
  color?: string;
}) {
  return (
    <Card>
      <SectionTitle title={title} meta={unit} />
      <p className="chart-context">{context}</p>
      {data.length ? (
        <Suspense fallback={<p>Loading chart…</p>}>
          <TrendChart data={data} keys={keys} color={color} unit={unit} />
        </Suspense>
      ) : (
        <Empty
          title="No recorded data in this range"
          description="This metric appears when the relevant activity or set values have been recorded."
        />
      )}
    </Card>
  );
}
export function Analytics() {
  const { db } = useApp();
  const [tab, setTab] = useState("Overview");
  const [range, setRange] = useState("90 days");
  const [customStart, setCustomStart] = useState(addDays(today(), -30));
  const [customEnd, setCustomEnd] = useState(today());
  const [exId, setExId] = useState("ex-2");
  const [terrain, setTerrain] = useState(false);
  const from =
    range === "Custom"
      ? customStart
      : addDays(
          today(),
          range === "7 days"
            ? -6
            : range === "30 days"
              ? -29
              : range === "90 days"
                ? -89
                : -364,
        );
  const to = range === "Custom" ? customEnd : today();
  const summary = trainingSummary(db, from, to);
  const context = `${from} → ${to}`;
  const weeks = Array.from(
    {
      length: Math.min(
        53,
        Math.ceil(
          (new Date(to + "T12:00:00").getTime() -
            new Date(from + "T12:00:00").getTime()) /
            604800000,
        ) + 1,
      ),
    },
    (_, i) => addDays(monday(from), i * 7),
  )
    .filter((date) => date <= to)
    .map((date) => {
      const s = trainingSummary(db, date, addDays(date, 6));
      return {
        date,
        Planned: Math.round(s.plannedMinutes / 6) / 10,
        Completed: Math.round(s.completedMinutes / 6) / 10,
      };
    });
  const check = latestCheckin(db);
  const logs = Object.values(db.strengthLogs).filter(
    (l) => l.completed && l.date >= from && l.date <= to,
  );
  const exercisesWithHistory = [
    ...new Set(
      logs.flatMap((l) =>
        l.sets.filter((s) => s.done).map((s) => s.exerciseId),
      ),
    ),
  ];
  const history = exerciseHistory(db, exId).filter(
    (h) => h.date >= from && h.date <= to,
  );
  return (
    <>
      <PageTitle
        eyebrow="ANALYTICS / RECORDED TRAINING"
        title="Performance analytics"
        description="Training volume, sport progression and recorded strength performance."
        action={
          <select
            aria-label="Analytics date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {["7 days", "30 days", "90 days", "12 months", "Custom"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        }
      />
      {range === "Custom" && (
        <div className="form-grid">
          <Field label="Start date">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              min={customStart}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </Field>
        </div>
      )}
      <div className="compact-metrics analytics-summary">
        <div>
          <span>COMPLETED / PLANNED</span>
          <strong>
            {(summary.completedMinutes / 60).toFixed(1)}
            <small> / {(summary.plannedMinutes / 60).toFixed(1)} h</small>
          </strong>
        </div>
        <div>
          <span>ADHERENCE</span>
          <strong>
            {summary.adherence == null ? "—" : summary.adherence + "%"}
            <small>
              {" "}
              {summary.done}/{summary.due}
            </small>
          </strong>
        </div>
        <div>
          <span>SESSIONS</span>
          <strong>{summary.completedSessions}</strong>
        </div>
        <div>
          <span>SESSION LOAD</span>
          <strong>
            {Math.round(summary.load)}
            <small> min × RPE</small>
          </strong>
        </div>
      </div>
      <div className="segmented analytics-tabs page-tabs">
        {["Overview", ...sports].map((s) => (
          <button
            key={s}
            className={tab === s ? "active" : ""}
            onClick={() => setTab(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="analytics-date-context">
        {context} · Demo history is fictional. Manual completions may use
        workout distance estimates.
      </p>
      {tab === "Overview" ? (
        <>
          <div className="two-col">
            <Card>
              <SectionTitle
                title="Planned vs completed volume"
                meta="HOURS / WEEK"
              />
              <Suspense>
                <HoursChart data={weeks} />
              </Suspense>
            </Card>
            <Card>
              <SectionTitle
                title="Discipline distribution"
                meta="COMPLETED / PLANNED"
              />
              <div className="analytics-distribution">
                {summary.distribution.map((d) => (
                  <div key={d.name}>
                    <div className="button-row spread">
                      <span style={{ color: colors[d.name] }}>{d.name}</span>
                      <strong>
                        {hours(d.value)} <small>/ {hours(d.planned)}</small>
                      </strong>
                    </div>
                    <div>
                      <i
                        style={{
                          width: `${Math.min(100, (d.value / Math.max(1, summary.completedMinutes)) * 100)}%`,
                          background: colors[d.name],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="helper">
                Completed totals come from activities; planned totals come from
                calendar definitions, including skipped prescriptions.
              </p>
            </Card>
            <ChartPanel
              title="Readiness & fatigue"
              unit=" /5"
              context={context + " · subjective daily scales"}
              data={Object.values(db.recovery)
                .filter((r) => r.date >= from && r.date <= to)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((r) => ({
                  date: r.date,
                  Readiness: r.readiness,
                  Fatigue: r.fatigue,
                }))}
              keys={["Readiness", "Fatigue"]}
              color="#72D9AF"
            />
            <ChartPanel
              title="Session load"
              unit=" AU"
              context="Duration × RPE (quick completions default to RPE 4). A descriptive workload measure, not an injury or medical prediction."
              data={summary.activities
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((a) => ({
                  date: a.date,
                  Load: Math.round(a.minutes * a.rpe),
                }))}
              keys={["Load"]}
            />
          </div>
          <details
            className="terrain-details"
            open={terrain}
            onToggle={(e) => setTerrain(e.currentTarget.open)}
          >
            <summary>
              Inspect 12-week training terrain{" "}
              <span>Interactive 3D / rotate</span>
            </summary>
            {terrain && (
              <div className="terrain-content">
                <AeronScene
                  variant="terrain"
                  values={weeklyData(db).map((w) =>
                    sports.reduce((n, s) => n + Number(w[s]), 0),
                  )}
                />
                <Suspense>
                  <VolumeChart data={weeklyData(db)} />
                </Suspense>
              </div>
            )}
          </details>
        </>
      ) : tab === "Strength" ? (
        <>
          <Field label="Exercise progression">
            <select value={exId} onChange={(e) => setExId(e.target.value)}>
              {[...new Set([exId, ...exercisesWithHistory])].map((id) => (
                <option key={id} value={id}>
                  {db.exercises[id]?.name || id}
                </option>
              ))}
            </select>
          </Field>
          <div className="two-col">
            <ChartPanel
              title="Working volume"
              unit=" kg·reps"
              context={`${db.exercises[exId]?.name} · completed working rep sets; excludes timed holds and warm-ups`}
              data={history.map((h) => ({ date: h.date, Volume: h.volume }))}
              keys={["Volume"]}
              color={colors.Strength}
            />
            <ChartPanel
              title="Load & rep progression"
              unit=" kg"
              context={`${db.exercises[exId]?.name} · best completed load per session; reps are shown below`}
              data={history.map((h) => ({ date: h.date, Load: h.weight }))}
              keys={["Load"]}
              color={colors.Strength}
            />
            <Card>
              <SectionTitle title="Personal records" />
              <div className="record-table">
                {history.length ? (
                  history
                    .slice(-10)
                    .reverse()
                    .map((h) => (
                      <div key={h.id}>
                        <span>{h.date}</span>
                        <strong>{h.record}</strong>
                        <span>
                          {h.estimated1RM
                            ? h.estimated1RM + "kg est. 1RM"
                            : "No eligible estimate"}
                        </span>
                      </div>
                    ))
                ) : (
                  <Empty
                    title="No recorded sets"
                    description="Log a strength session to build exercise-specific history."
                  />
                )}
              </div>
              <p className="helper">
                1RM is an Epley estimate from loaded sets of 1–12 reps, not a
                measured lift.
              </p>
            </Card>
            <Card>
              <SectionTitle
                title="Movement distribution"
                meta="COMPLETED WORKING SETS"
              />
              <div className="analytics-distribution">
                {[
                  ...new Set(
                    logs.flatMap((l) =>
                      l.sets.map(
                        (s) =>
                          db.exercises[s.exerciseId]?.category || "Unknown",
                      ),
                    ),
                  ),
                ].map((cat) => {
                  const sets = logs
                    .flatMap((l) => l.sets)
                    .filter(
                      (s) =>
                        s.done &&
                        s.kind !== "warmup" &&
                        db.exercises[s.exerciseId]?.category === cat,
                    ).length;
                  return (
                    <div className="button-row spread" key={cat}>
                      <span>{cat}</span>
                      <strong>{sets} sets</strong>
                    </div>
                  );
                })}
              </div>
              <p className="helper">
                {logs.length} completed strength sessions in this range.
                Adherence uses the same calendar lifecycle as endurance
                sessions.
              </p>
            </Card>
          </div>
        </>
      ) : (
        <SportAnalytics
          sport={tab as Sport}
          db={db}
          from={from}
          to={to}
          context={context}
        />
      )}
    </>
  );
}
function SportAnalytics({
  sport,
  db,
  from,
  to,
  context,
}: {
  sport: Sport;
  db: ReturnType<typeof useApp>["db"];
  from: string;
  to: string;
  context: string;
}) {
  const rows = sportProgress(db, sport, from, to);
  const unit = sport === "Swimming" ? " min/100m" : " min/km";
  const pace = rows
    .filter((r) => r.Pace != null)
    .map((r) => ({ date: r.date, Pace: r.Pace! }));
  const power = rows
    .filter((r) => r.Power != null)
    .map((r) => ({ date: r.date, Power: r.Power! }));
  const ss = Object.values(db.sessions).filter(
    (s) =>
      s.date >= from &&
      s.date <= to &&
      db.workouts[s.workoutId].sport === sport,
  );
  const frequency = Array.from(new Set(rows.map((r) => monday(r.date))))
    .sort()
    .map((date) => ({
      date,
      Sessions: rows.filter((r) => monday(r.date) === date).length,
    }));
  const long = rows.filter(
    (r) => r.Duration >= (sport === "Cycling" ? 90 : 75),
  );
  const zoneMinutes = [1, 2, 3, 4, 5].map((zone) => ({
    zone,
    minutes: Object.values(db.activities)
      .filter(
        (a) =>
          a.date >= from &&
          a.date <= to &&
          db.workouts[a.workoutId].sport === sport,
      )
      .reduce((n, a) => {
        const w = db.workouts[a.workoutId];
        return (
          n +
          ((timeInZone(w).find((z) => z.zone === zone)?.minutes || 0) *
            a.minutes) /
            Math.max(1, duration(w))
        );
      }, 0),
  }));
  return (
    <div className="two-col">
      <ChartPanel
        title={sport === "Cycling" ? "Recorded cycling power" : `${sport} pace`}
        unit={sport === "Cycling" ? " W" : unit}
        context={
          context +
          " · only recorded pace/power; missing metrics are not estimated"
        }
        data={sport === "Cycling" ? power : pace}
        keys={[sport === "Cycling" ? "Power" : "Pace"]}
        color={colors[sport]}
      />
      <ChartPanel
        title={`${sport} distance`}
        unit=" km"
        context={context}
        data={rows.map((r) => ({ date: r.date, Distance: r.Distance }))}
        keys={["Distance"]}
        color={colors[sport]}
      />
      <ChartPanel
        title={`${sport} duration`}
        unit=" min"
        context={context}
        data={rows.map((r) => ({ date: r.date, Duration: r.Duration }))}
        keys={["Duration"]}
        color={colors[sport]}
      />
      {sport === "Swimming" ? (
        <>
          <ChartPanel
            title="Swim frequency"
            unit=" sessions"
            context="Sessions per calendar week · no inferred pool splits"
            data={frequency}
            keys={["Sessions"]}
            color={colors.Swimming}
          />
          <Card>
            <SectionTitle title="Technique & set completion" />
            <div className="context-row">
              <span>Technique session adherence</span>
              <strong>
                {
                  ss.filter(
                    (s) =>
                      /technique|drill/i.test(db.workouts[s.workoutId].title) &&
                      s.status === "completed",
                  ).length
                }{" "}
                /{" "}
                {
                  ss.filter((s) =>
                    /technique|drill/i.test(db.workouts[s.workoutId].title),
                  ).length
                }
              </strong>
            </div>
            {(() => {
              const logged = Object.values(db.activities).filter(
                (a) =>
                  a.date >= from &&
                  a.date <= to &&
                  db.workouts[a.workoutId].sport === "Swimming" &&
                  a.stepCompletion,
              );
              return logged.length ? (
                <div className="context-row">
                  <span>Explicitly recorded set / rep progress</span>
                  <strong>
                    {logged.reduce(
                      (n, a) => n + a.stepCompletion!.completed,
                      0,
                    )}{" "}
                    / {logged.reduce((n, a) => n + a.stepCompletion!.total, 0)}
                  </strong>
                </div>
              ) : null;
            })()}
            <p className="helper">
              Set/rep completion comes only from explicitly logged execution
              steps. Legacy and manual activity completions do not imply that
              every set was completed.
            </p>
          </Card>
        </>
      ) : (
        <ChartPanel
          title={
            sport === "Cycling"
              ? "Long-ride development"
              : "Long-run development"
          }
          unit=" min"
          context={
            sport === "Cycling"
              ? "Recorded sessions of 90 minutes or longer"
              : "Recorded sessions of 75 minutes or longer"
          }
          data={long.map((r) => ({ date: r.date, Duration: r.Duration }))}
          keys={["Duration"]}
          color={colors[sport]}
        />
      )}
      <Card>
        <SectionTitle
          title={
            sport === "Cycling"
              ? "Time in prescribed power zones"
              : sport === "Running"
                ? "Pace at comparable effort"
                : "Session adherence"
          }
        />
        {sport === "Cycling" ? (
          <>
            <div className="analytics-distribution">
              {zoneMinutes.map((z) => (
                <div className="button-row spread" key={z.zone}>
                  <span>Zone {z.zone}</span>
                  <strong>{z.minutes.toFixed(0)} min</strong>
                </div>
              ))}
            </div>
            <p className="helper">
              Derived from completed workout definitions, scaled to recorded
              duration. This is prescribed zone time, not measured power-trace
              data.
            </p>
            <h3>FTP history</h3>
            {db.zoneHistory.filter((z) => z.date >= from && z.date <= to)
              .length ? (
              db.zoneHistory
                .filter((z) => z.date >= from && z.date <= to)
                .map((z, i) => (
                  <div key={i} className="context-row">
                    <span>{z.date}</span>
                    <strong>{z.ftp} W · configured</strong>
                  </div>
                ))
            ) : (
              <p className="helper">
                No recorded FTP changes in this range. Current setting:{" "}
                {db.zones.ftp} W.
              </p>
            )}
          </>
        ) : sport === "Running" ? (
          <>
            <div className="record-table">
              {[
                ...new Set(
                  rows.filter((r) => r.Pace != null).map((r) => r.RPE),
                ),
              ]
                .sort((a, b) => a - b)
                .map((rpe) => {
                  const matches = rows.filter(
                    (r) => r.RPE === rpe && r.Pace != null,
                  );
                  return (
                    <div key={rpe}>
                      <span>RPE {rpe}</span>
                      <strong>
                        {(
                          matches.reduce((n, r) => n + r.Pace!, 0) /
                          matches.length
                        ).toFixed(2)}{" "}
                        min/km
                      </strong>
                      <span>{matches.length} sessions</span>
                    </div>
                  );
                })}
            </div>
            <p className="helper">
              Grouped by recorded RPE. Weather, terrain and conditions are not
              controlled, so this does not isolate fitness changes.
            </p>
          </>
        ) : (
          <div className="context-row">
            <span>Completed sessions</span>
            <strong>
              {ss.filter((s) => s.status === "completed").length} / {ss.length}{" "}
              scheduled
            </strong>
          </div>
        )}
      </Card>
    </div>
  );
}
