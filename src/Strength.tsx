import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Plus,
  Check,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Search,
  Timer,
  Dumbbell,
  Save,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import {
  useApp,
  PageTitle,
  Card,
  Button,
  Field,
  Modal,
  Badge,
  Empty,
  useTimer,
  dateLabel,
} from "./ui";
import {
  uid,
  type StrengthWorkout,
  type StrengthExercise,
  type StrengthSet,
  type Exercise,
  type Database,
} from "./domain";
import {
  defaultEntry,
  loadCatalogue,
  startStrength,
  updateStrengthSet,
  substituteExercise,
  finishStrength,
  exerciseHistory,
  prescriptionFor,
} from "./strength-core";
import { setVolume, supersetUnits } from "./strength-engine";
const TrendChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.TrendChart })),
);
export function ExerciseDrawer({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const { db } = useApp();
  const history = exerciseHistory(db, exercise.id);
  const bestWeight = Math.max(0, ...history.map((h) => h.weight));
  const bestReps = Math.max(0, ...history.map((h) => h.maxReps));
  const bestEstimate = Math.max(0, ...history.map((h) => h.estimated1RM));
  return (
    <Modal
      open
      onClose={onClose}
      title={exercise.name}
      description={`${exercise.category} · ${exercise.equipment}`}
      wide
    >
      <div className="dialog-body exercise-detail">
        <div className="exercise-heading">
          <div className="movement-glyph">
            <Dumbbell size={36} strokeWidth={1} />
          </div>
          <div>
            <p>{exercise.muscles.join(" · ")}</p>
            <span className="eyebrow">
              {exercise.origin || "AERON"} ·{" "}
              {exercise.upstreamIds?.map((id) => "#" + id).join(", ") ||
                exercise.id}
            </span>
          </div>
        </div>
        <div className="compact-metrics">
          <div>
            <span>BEST LOAD</span>
            <strong>
              {bestWeight || "—"}
              <small> kg</small>
            </strong>
          </div>
          <div>
            <span>BEST REPS</span>
            <strong>{bestReps || "—"}</strong>
          </div>
          <div>
            <span>ESTIMATED 1RM</span>
            <strong>
              {bestEstimate || "—"}
              <small> kg · estimate</small>
            </strong>
          </div>
          <div>
            <span>SESSIONS</span>
            <strong>{history.length}</strong>
          </div>
        </div>
        <div className="two-col">
          <div>
            <h3>Technique</h3>
            <ol className="technique">
              {exercise.technique.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            <h3>Coaching cue</h3>
            <p className="cue">{exercise.cues}</p>
            <h3>Common mistakes</h3>
            <p>{exercise.mistakes}</p>
            <h3>Alternatives</h3>
            <p>
              {exercise.substitutions.join(" · ") ||
                "Choose a similar movement with equipment you can control."}
            </p>
            <p className="helper">
              Text demonstration. Exercise media is not included.{" "}
              {exercise.classification} ·{" "}
              {exercise.unilateral ? "Unilateral" : "Bilateral"} ·{" "}
              {exercise.compound ? "Compound" : "Isolation / stability"}.
            </p>
            {exercise.source && (
              <a
                className="text-link"
                href={exercise.source}
                target="_blank"
                rel="noreferrer"
              >
                Upstream text provenance <ArrowUpRight size={13} />
              </a>
            )}
          </div>
          <div>
            <h3>Recorded progression</h3>
            {history.length ? (
              <>
                <Suspense>
                  <TrendChart
                    data={history.map((h) => ({
                      date: h.date,
                      Load: h.weight,
                    }))}
                    keys={["Load"]}
                    color="#A68CFF"
                    unit=" kg"
                  />
                </Suspense>
                <div className="record-table">
                  {history
                    .slice(-8)
                    .reverse()
                    .map((h) => (
                      <div key={h.id}>
                        <span>{dateLabel(h.date)}</span>
                        <strong>{h.record}</strong>
                        <span>{h.volume.toFixed(0)} kg·reps</span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <Empty
                title="No recorded sets yet"
                description="Complete a session with this exercise to see history and records."
              />
            )}
            <p className="helper">
              Estimated 1RM uses Epley on completed loaded rep sets, capped at
              12 reps. It is not a measured maximum. Timed and warm-up sets are
              excluded.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
export function Strength() {
  const { db, setDb, toast } = useApp();
  const [tab, setTab] = useState("Training");
  const [q, setQ] = useState("");
  const [movement, setMovement] = useState("All");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [stance, setStance] = useState("All");
  const [pattern, setPattern] = useState("All");
  const [page, setPage] = useState(1);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [builder, setBuilder] = useState<StrengthWorkout | null>(null);
  const [discard, setDiscard] = useState(false);
  const [catalogueState, setCatalogueState] = useState(
    "Loading text catalogue…",
  );
  const [now, setNow] = useState(Date.now());
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  const scheduledId = query.get("session") || undefined;
  const scheduled = scheduledId ? db.sessions[scheduledId] : undefined;
  const scheduledTemplate = scheduled
    ? db.workouts[scheduled.workoutId]?.strengthTemplateId
    : undefined;
  useEffect(() => {
    let active = true;
    loadCatalogue(db)
      .then((loaded) => {
        if (active) {
          setDb((current) => ({
            ...current,
            exercises: Object.fromEntries(
              Object.entries(loaded.exercises).map(([id, e]) => [
                id,
                current.exercises[id]
                  ? {
                      ...e,
                      ...current.exercises[id],
                      origin: e.origin,
                      upstreamIds: e.upstreamIds,
                      source: e.source,
                    }
                  : e,
              ]),
            ),
          }));
          setCatalogueState("");
        }
      })
      .catch(
        () =>
          active &&
          setCatalogueState(
            "Catalogue unavailable. Your saved and AERON exercises remain available. Reload to retry.",
          ),
      );
    return () => {
      active = false;
    };
  }, []);
  const log = Object.values(db.strengthLogs).find((l) => !l.completed);
  const tick = useCallback(() => setNow(Date.now()), []);
  useTimer(!!log && !log.paused, tick);
  const rest = Math.max(0, Math.ceil(((log?.restEndsAt || 0) - now) / 1000));
  const work = Math.max(0, Math.ceil(((log?.workEndsAt || 0) - now) / 1000));
  function mutate(fn: (d: Database) => Database) {
    try {
      setDb(fn(db));
    } catch (error) {
      toast((error as Error).message);
    }
  }
  function patchLog(patch: Partial<NonNullable<typeof log>>) {
    if (log)
      setDb((d) => ({
        ...d,
        strengthLogs: {
          ...d.strengthLogs,
          [log.id]: { ...d.strengthLogs[log.id], ...patch },
        },
      }));
  }
  function record(id: string, patch: Partial<StrengthSet>) {
    if (log) mutate((d) => updateStrengthSet(d, log.id, id, patch));
  }
  function finishHold() {
    if (!log?.workSetId) return;
    const set = log.sets.find((s) => s.id === log.workSetId)!;
    const elapsed = Math.max(
      1,
      (set.targetSeconds || set.seconds || 30) - work,
    );
    const next = updateStrengthSet(db, log.id, set.id, {
      seconds: elapsed,
      done: true,
    });
    next.strengthLogs[log.id] = {
      ...next.strengthLogs[log.id],
      workSetId: undefined,
      workEndsAt: undefined,
      restEndsAt: Date.now() + (set.restSeconds ?? 90) * 1000,
    };
    setDb(next);
  }
  useEffect(() => {
    if (log?.workEndsAt && now >= log.workEndsAt && !log.paused) finishHold();
  }, [now]);
  function start(id: string, sid?: string) {
    mutate((d) => startStrength(d, id, sid).db);
    setTab("Training");
  }
  const entries = log
    ? [...new Set(log.sets.map((s) => s.entryId || s.exerciseId))]
    : [];
  const activeId =
    log?.activeEntryId && entries.includes(log.activeEntryId)
      ? log.activeEntryId
      : entries[0];
  const currentSets =
    log?.sets.filter((s) => (s.entryId || s.exerciseId) === activeId) || [];
  const currentExercise = currentSets[0]
    ? db.exercises[currentSets[0].exerciseId]
    : null;
  const currentIndex = entries.indexOf(activeId);
  const previous = currentExercise
    ? exerciseHistory(db, currentExercise.id).at(-1)
    : undefined;
  const all = Object.values(db.exercises);
  const filtered = all.filter(
    (e) =>
      `${e.name} ${e.muscles.join(" ")}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (movement === "All" || e.category === movement) &&
      (muscle === "All" || e.muscles.includes(muscle)) &&
      (equipment === "All" || e.equipment === equipment) &&
      (difficulty === "All" || e.difficulty === difficulty) &&
      (stance === "All" || e.unilateral === (stance === "Unilateral")) &&
      (pattern === "All" || e.compound === (pattern === "Compound")),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const shown = filtered.slice(
    (Math.min(page, pages) - 1) * 24,
    Math.min(page, pages) * 24,
  );
  function saveTemplate() {
    if (!builder) return;
    if (
      !builder.name.trim() ||
      !builder.entries.length ||
      builder.minutes <= 0 ||
      builder.entries.some(
        (e) =>
          !db.exercises[e.exerciseId] ||
          e.sets < 1 ||
          e.sets > 12 ||
          !Number.isInteger(e.sets) ||
          e.reps < 1 ||
          e.weight < 0 ||
          e.restSeconds < 0 ||
          e.warmupSets < 0 ||
          e.warmupSets > 5 ||
          e.seconds < 1 ||
          e.increment <= 0 ||
          !Number.isFinite(
            e.sets +
              e.reps +
              e.weight +
              e.seconds +
              e.restSeconds +
              e.rpe +
              e.rir +
              e.increment,
          ) ||
          e.rpe < 1 ||
          e.rpe > 10 ||
          e.rir < 0 ||
          e.rir > 10 ||
          !Number.isInteger(e.warmupSets) ||
          e.minReps > e.reps,
      )
    ) {
      toast(
        "Check the workout name, exercises, sets, reps, load and time values.",
      );
      return;
    }
    setDb((d) => ({
      ...d,
      strengthWorkouts: { ...d.strengthWorkouts, [builder.id]: builder },
    }));
    setBuilder(null);
    toast("Strength template saved. Past logs retain their recorded sets.");
  }
  function changeEntry(id: string, patch: Partial<StrengthExercise>) {
    if (builder)
      setBuilder({
        ...builder,
        entries: builder.entries.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      });
  }
  return (
    <>
      <PageTitle
        eyebrow="STRENGTH / OPENGYM ADAPTED"
        title="Strength training"
        description="Build resilience. Log the work. Track what changes."
        action={
          <Button
            onClick={() =>
              setBuilder({
                id: uid(),
                name: "My endurance strength",
                minutes: 45,
                notes: "",
                entries: [],
              })
            }
          >
            <Plus size={15} />
            Build workout
          </Button>
        }
      />
      <div className="segmented page-tabs">
        {["Training", "Exercise library", "History & records"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Training" &&
        (log && currentExercise ? (
          <section className="strength-execution">
            <div className="execution-command">
              <div>
                <span className="eyebrow">
                  {db.strengthWorkouts[log.template]?.name ||
                    "Strength session"}
                </span>
                <h2>{currentExercise.name}</h2>
                <span className="small-text muted">
                  {log.sets.filter((s) => s.done).length}/{log.sets.length} sets
                  · Linked calendar session · {log.date}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (log.paused)
                    patchLog({
                      paused: false,
                      restEndsAt: log.restRemaining
                        ? Date.now() + log.restRemaining * 1000
                        : undefined,
                      workEndsAt: log.workRemaining
                        ? Date.now() + log.workRemaining * 1000
                        : undefined,
                      startedAt: Date.now(),
                    });
                  else
                    patchLog({
                      paused: true,
                      restRemaining: rest,
                      restEndsAt: undefined,
                      workRemaining: work,
                      workEndsAt: undefined,
                      elapsedSeconds:
                        (log.elapsedSeconds || 0) +
                        (Date.now() - (log.startedAt || Date.now())) / 1000,
                    });
                }}
              >
                {log.paused ? <Play size={15} /> : <Pause size={15} />}{" "}
                {log.paused ? "Resume session" : "Pause session"}
              </Button>
            </div>
            <progress
              max={log.sets.length}
              value={log.sets.filter((s) => s.done).length}
            />
            <div className="exercise-navigation">
              {entries.map((id, i) => {
                const set = log.sets.find(
                  (s) => (s.entryId || s.exerciseId) === id,
                )!;
                return (
                  <button
                    key={id}
                    className={id === activeId ? "active" : ""}
                    onClick={() => patchLog({ activeEntryId: id })}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {db.exercises[set.exerciseId]?.name}
                    {set.superset && <small>SUPERSET {set.superset}</small>}
                  </button>
                );
              })}
            </div>
            <div className="two-col execution-columns">
              <Card>
                <div className="button-row spread">
                  <button
                    className="text-link"
                    onClick={() => setExercise(currentExercise)}
                  >
                    Technique & exercise history <ArrowUpRight size={13} />
                  </button>
                  <Badge sport="Strength">{currentExercise.category}</Badge>
                </div>
                <p className="previous-performance">
                  Previous session:{" "}
                  {previous
                    ? `${previous.date} · ${previous.record} · ${previous.volume} kg·reps`
                    : "No recorded performance yet"}
                </p>
                {currentSets[0]?.superset && (
                  <p className="helper">
                    Superset {currentSets[0].superset}:{" "}
                    {supersetUnits(
                      entries.map((id) => ({
                        superset: log.sets.find((s) => s.entryId === id)
                          ?.superset,
                      })),
                    ).find((u) => u.includes(currentIndex))?.length || 1}{" "}
                    adjacent exercises. Alternate exercises with controlled
                    transitions.
                  </p>
                )}
                <div className="set-header v2-set-header">
                  <span>SET</span>
                  <span>
                    {currentSets[0]?.mode === "time" ? "SEC" : "REPS"}
                  </span>
                  <span>KG</span>
                  <span>RPE</span>
                  <span>DONE</span>
                </div>
                {currentSets.map((s, i) => (
                  <div className="set-block" key={s.id}>
                    <div className={`set-row ${s.done ? "done" : ""}`}>
                      <span className="mono">
                        {s.kind === "warmup" ? "W" : i + 1}
                      </span>
                      <input
                        aria-label={`${currentExercise.name} set ${i + 1} ${s.mode === "time" ? "seconds" : "reps"}`}
                        type="number"
                        min="0"
                        value={s.mode === "time" ? s.seconds : s.reps}
                        onChange={(e) =>
                          record(
                            s.id,
                            s.mode === "time"
                              ? { seconds: +e.target.value }
                              : { reps: +e.target.value },
                          )
                        }
                      />
                      <input
                        aria-label={`${currentExercise.name} set ${i + 1} weight in kg`}
                        type="number"
                        min="0"
                        step=".5"
                        value={s.weight}
                        onChange={(e) =>
                          record(s.id, { weight: +e.target.value })
                        }
                      />
                      <input
                        aria-label={`${currentExercise.name} set ${i + 1} RPE`}
                        type="number"
                        min="1"
                        max="10"
                        step=".5"
                        value={s.rpe}
                        onChange={(e) => record(s.id, { rpe: +e.target.value })}
                      />
                      <button
                        className={`set-check ${s.done ? "checked" : ""}`}
                        aria-pressed={s.done}
                        aria-label={`Complete ${currentExercise.name} set ${i + 1}`}
                        onClick={() => {
                          if (log.paused) {
                            toast("Resume the session to log a set.");
                            return;
                          }
                          const next = updateStrengthSet(db, log.id, s.id, {
                            done: !s.done,
                          });
                          next.strengthLogs[log.id].restEndsAt = !s.done
                            ? Date.now() + (s.restSeconds ?? 90) * 1000
                            : undefined;
                          setDb(next);
                        }}
                      >
                        <Check size={18} />
                      </button>
                    </div>
                    <details className="set-options">
                      <summary>
                        Set options · {s.kind || "working"}
                        {s.rir != null ? ` · ${s.rir} RIR` : ""} ·{" "}
                        {s.restSeconds ?? 90}s rest
                      </summary>
                      <div className="form-grid">
                        <Field label={`Set ${i + 1} type`}>
                          <select
                            value={s.kind}
                            onChange={(e) =>
                              record(s.id, {
                                kind: e.target.value as "warmup" | "working",
                              })
                            }
                          >
                            <option value="working">Working set</option>
                            <option value="warmup">Warm-up set</option>
                          </select>
                        </Field>
                        <Field label={`Set ${i + 1} RIR`}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step=".5"
                            value={s.rir ?? ""}
                            onChange={(e) =>
                              record(s.id, {
                                rir:
                                  e.target.value === ""
                                    ? undefined
                                    : +e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label={`Set ${i + 1} rest seconds`}>
                          <input
                            type="number"
                            min="0"
                            value={s.restSeconds}
                            onChange={(e) =>
                              record(s.id, { restSeconds: +e.target.value })
                            }
                          />
                        </Field>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            patchLog({
                              sets: log.sets.filter((x) => x.id !== s.id),
                            })
                          }
                          disabled={currentSets.length <= 1 || s.done}
                        >
                          <Trash2 size={13} />
                          Remove set
                        </Button>
                      </div>
                    </details>
                    {s.mode === "time" && !s.done && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={log.paused || !!log.workEndsAt}
                        onClick={() =>
                          patchLog({
                            workSetId: s.id,
                            workEndsAt: Date.now() + (s.seconds || 30) * 1000,
                            restEndsAt: undefined,
                          })
                        }
                      >
                        <Timer size={14} />
                        Time this set
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patchLog({
                      sets: [
                        ...log.sets,
                        {
                          ...currentSets.at(-1)!,
                          id: uid(),
                          done: false,
                          kind: "working",
                        },
                      ],
                    })
                  }
                >
                  <Plus size={14} />
                  Add set
                </Button>
                <Field label="Substitute exercise">
                  <select
                    value={currentExercise.id}
                    onChange={(e) =>
                      mutate((d) =>
                        substituteExercise(d, log.id, activeId, e.target.value),
                      )
                    }
                  >
                    {all.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="helper">
                  Substitution changes only this exercise occurrence. Completed
                  sets keep their original exercise.
                </p>
                <div className="button-row spread">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === 0}
                    onClick={() =>
                      patchLog({ activeEntryId: entries[currentIndex - 1] })
                    }
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === entries.length - 1}
                    onClick={() =>
                      patchLog({ activeEntryId: entries[currentIndex + 1] })
                    }
                  >
                    Next exercise
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </Card>
              <Card className="execution-sidebar">
                <div className="rest-clock">
                  <span className="eyebrow">
                    {log.workEndsAt
                      ? "WORK TIMER"
                      : log.paused
                        ? "SESSION PAUSED"
                        : "REST TIMER"}
                  </span>
                  <strong>
                    {Math.floor(
                      (log.workEndsAt
                        ? work
                        : log.paused
                          ? log.restRemaining || 0
                          : rest) / 60,
                    )}
                    :
                    {String(
                      (log.workEndsAt
                        ? work
                        : log.paused
                          ? log.restRemaining || 0
                          : rest) % 60,
                    ).padStart(2, "0")}
                  </strong>
                  <div className="button-row wrap">
                    {log.workEndsAt ? (
                      <Button onClick={finishHold}>End hold & log time</Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            patchLog({
                              restEndsAt:
                                Date.now() + Math.max(0, rest + 15) * 1000,
                            })
                          }
                        >
                          +15s
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            patchLog({
                              restEndsAt: undefined,
                              restRemaining: 0,
                            })
                          }
                        >
                          Skip rest
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            patchLog({ restEndsAt: Date.now() + 90 * 1000 })
                          }
                        >
                          Start 90s rest
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="compact-metrics">
                  <div>
                    <span>WORKING VOLUME</span>
                    <strong>
                      {log.sets
                        .filter((s) => s.kind !== "warmup")
                        .reduce((n, s) => n + setVolume(s), 0)
                        .toFixed(0)}
                      <small> kg·reps</small>
                    </strong>
                  </div>
                </div>
                <Field label="Recorded session duration (minutes)">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={log.minutes}
                    onChange={(e) => patchLog({ minutes: +e.target.value })}
                  />
                </Field>
                <Field label="Session notes">
                  <textarea
                    value={log.notes}
                    onChange={(e) => patchLog({ notes: e.target.value })}
                  />
                </Field>
                <Button
                  onClick={() => mutate((d) => finishStrength(d, log.id))}
                >
                  <Check size={16} />
                  Complete strength session
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDiscard(true)}
                >
                  Discard active draft
                </Button>
                <p className="helper">
                  Finishing updates this same calendar session, activity
                  history, weekly volume and analytics. Unchecked sets remain
                  uncompleted.
                </p>
              </Card>
            </div>
          </section>
        ) : (
          <>
            <div className="section-title">
              <h2>
                {scheduled
                  ? "Scheduled strength session"
                  : "Your strength rotation"}
              </h2>
              <span className="muted small-text">
                Two sessions / week by default
              </span>
            </div>
            <div className="strength-rotation">
              {Object.values(db.strengthWorkouts).map((t) => (
                <Card key={t.id}>
                  <div className="button-row spread">
                    <span className="eyebrow">
                      {t.minutes} MIN · {t.entries.length} EXERCISES
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBuilder(structuredClone(t))}
                    >
                      Edit template
                    </Button>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.notes}</p>
                  <div className="template-exercises">
                    {t.entries.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setExercise(db.exercises[e.exerciseId])}
                      >
                        {db.exercises[e.exerciseId]?.name || "Missing exercise"}
                        <span>
                          {e.sets} ×{" "}
                          {e.mode === "time" ? `${e.seconds}s` : e.reps}
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() =>
                      start(
                        t.id,
                        scheduledTemplate === t.id ? scheduledId : undefined,
                      )
                    }
                  >
                    <Play size={15} />
                    {scheduledTemplate === t.id
                      ? "Start scheduled session"
                      : `Start Strength ${t.id === "A" || t.id === "B" ? t.id : t.name}`}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        ))}
      {tab === "Exercise library" && (
        <>
          <div className="catalogue-heading">
            <strong>{all.length.toLocaleString()} exercises</strong>
            <span className="muted small-text">
              OpenGym-derived text catalogue · media excluded
            </span>
          </div>
          {catalogueState && (
            <p role="status" className="helper">
              {catalogueState}
            </p>
          )}
          <div className="filters catalogue-filters">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Search exercises"
                placeholder="Exercise or muscle…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {[
              {
                label: "Movement pattern",
                v: movement,
                set: setMovement,
                values: [...new Set(all.map((e) => e.category))],
              },
              {
                label: "Muscle group",
                v: muscle,
                set: setMuscle,
                values: [...new Set(all.flatMap((e) => e.muscles))].sort(),
              },
              {
                label: "Equipment",
                v: equipment,
                set: setEquipment,
                values: [...new Set(all.map((e) => e.equipment))].sort(),
              },
              {
                label: "Difficulty",
                v: difficulty,
                set: setDifficulty,
                values: [...new Set(all.map((e) => e.difficulty))],
              },
              {
                label: "Stance",
                v: stance,
                set: setStance,
                values: ["Unilateral", "Bilateral"],
              },
              {
                label: "Exercise type",
                v: pattern,
                set: setPattern,
                values: ["Compound", "Isolation / stability"],
              },
            ].map((f) => (
              <select
                key={f.label}
                aria-label={f.label}
                value={f.v}
                onChange={(e) => {
                  f.set(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">{f.label}</option>
                {f.values.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ))}
          </div>
          <div className="exercise-catalogue">
            {shown.map((e) => (
              <button key={e.id} onClick={() => setExercise(e)}>
                <span className="movement-glyph">
                  <Dumbbell size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <strong>{e.name}</strong>
                  <p>{e.muscles.slice(0, 3).join(" · ")}</p>
                </div>
                <span className="exercise-equipment">{e.equipment}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
          {!shown.length && (
            <Empty
              title="No matching exercises"
              description="Try a different name, muscle group, or equipment filter."
            />
          )}
          <div className="pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              {filtered.length} results · Page {Math.min(page, pages)} of{" "}
              {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
          <p className="helper">
            Difficulty not supplied by upstream is marked “Not specified.”
            Movement, compound and unilateral classifications are inferred
            unless curated by AERON.
          </p>
        </>
      )}
      {tab === "History & records" && (
        <>
          <div className="compact-metrics">
            <div>
              <span>COMPLETED STRENGTH</span>
              <strong>
                {
                  Object.values(db.strengthLogs).filter((l) => l.completed)
                    .length
                }
                <small> sessions</small>
              </strong>
            </div>
            <div>
              <span>WORKING VOLUME</span>
              <strong>
                {Object.values(db.strengthLogs)
                  .filter((l) => l.completed)
                  .flatMap((l) => l.sets)
                  .filter((s) => s.kind !== "warmup")
                  .reduce((n, s) => n + setVolume(s), 0)
                  .toFixed(0)}
                <small> kg·reps</small>
              </strong>
            </div>
          </div>
          <div className="history-session-list">
            {Object.values(db.strengthLogs)
              .filter((l) => l.completed)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((l) => (
                <Card key={l.id}>
                  <div className="section-title">
                    <h3>
                      {db.strengthWorkouts[l.template]?.name ||
                        `Strength ${l.template}`}
                    </h3>
                    <span className="mono small-text">
                      {dateLabel(l.date)} · {l.minutes || 45} min
                    </span>
                  </div>
                  <div className="record-table">
                    {[...new Set(l.sets.map((s) => s.exerciseId))].map((id) => {
                      const sets = l.sets.filter(
                        (s) => s.exerciseId === id && s.done,
                      );
                      return (
                        <button
                          className="history-exercise"
                          key={id}
                          onClick={() => setExercise(db.exercises[id])}
                        >
                          <span>{db.exercises[id]?.name}</span>
                          <strong>
                            {Math.max(0, ...sets.map((s) => s.weight))} kg
                          </strong>
                          <span>
                            {sets.length} completed sets{" "}
                            <ArrowUpRight size={12} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {l.notes && <p className="helper">{l.notes}</p>}
                </Card>
              ))}
          </div>
        </>
      )}
      {discard && log && (
        <Modal
          open
          onClose={() => setDiscard(false)}
          title="Discard active strength draft?"
          description="The calendar prescription remains. Draft set entries will be removed."
        >
          <div className="dialog-body">
            <div className="button-row">
              <Button variant="outline" onClick={() => setDiscard(false)}>
                Keep logging
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const logs = { ...db.strengthLogs };
                  delete logs[log.id];
                  setDb({ ...db, strengthLogs: logs });
                  setDiscard(false);
                  toast("Draft discarded. Calendar session remains planned.");
                }}
              >
                Discard draft
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {exercise && (
        <ExerciseDrawer exercise={exercise} onClose={() => setExercise(null)} />
      )}
      {builder && (
        <Modal
          open
          onClose={() => setBuilder(null)}
          title="Strength workout builder"
          description="Editable templates. Recorded history remains unchanged."
          wide
        >
          <div className="dialog-body">
            <div className="form-grid">
              <Field label="Strength workout name">
                <input
                  value={builder.name}
                  onChange={(e) =>
                    setBuilder({ ...builder, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Planned duration (minutes)">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={builder.minutes}
                  onChange={(e) =>
                    setBuilder({ ...builder, minutes: +e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="builder-exercises">
              {builder.entries.map((entry, i) => (
                <details
                  className="builder-exercise"
                  key={entry.id}
                  open={i === 0 ? true : undefined}
                >
                  <summary>
                    <span className="mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{db.exercises[entry.exerciseId]?.name}</strong>
                    <span>
                      {entry.sets} ×{" "}
                      {entry.mode === "time" ? `${entry.seconds}s` : entry.reps}
                    </span>
                  </summary>
                  <div className="builder-entry-controls">
                    <div className="button-row wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={i === 0}
                        onClick={() => {
                          const a = [...builder.entries];
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          setBuilder({ ...builder, entries: a });
                        }}
                      >
                        <ArrowUp size={13} />
                        Up
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={i === builder.entries.length - 1}
                        onClick={() => {
                          const a = [...builder.entries];
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          setBuilder({ ...builder, entries: a });
                        }}
                      >
                        <ArrowDown size={13} />
                        Down
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setBuilder({
                            ...builder,
                            entries: builder.entries.filter(
                              (e) => e.id !== entry.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={13} />
                        Remove exercise
                      </Button>
                    </div>
                    <div className="form-grid">
                      <Field label={`Exercise ${i + 1} substitution`}>
                        <select
                          value={entry.exerciseId}
                          onChange={(e) =>
                            changeEntry(entry.id, {
                              exerciseId: e.target.value,
                            })
                          }
                        >
                          {all.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={`Exercise ${i + 1} mode`}>
                        <select
                          value={entry.mode}
                          onChange={(e) =>
                            changeEntry(entry.id, {
                              mode: e.target.value as "reps" | "time",
                            })
                          }
                        >
                          <option value="reps">Repetitions</option>
                          <option value="time">Timed hold / carry</option>
                        </select>
                      </Field>
                      {(
                        [
                          { k: "sets", l: "Working sets" },
                          { k: "reps", l: "Target reps" },
                          { k: "weight", l: "Load (kg)" },
                          { k: "warmupSets", l: "Warm-up sets" },
                          { k: "seconds", l: "Target seconds" },
                          { k: "restSeconds", l: "Rest seconds" },
                          { k: "rpe", l: "Target RPE" },
                          { k: "rir", l: "Target RIR" },
                          { k: "minReps", l: "Rep-range minimum" },
                          { k: "increment", l: "Load increment (kg)" },
                        ] as const
                      ).map(({ k, l }) => (
                        <Field key={k} label={`${l} · exercise ${i + 1}`}>
                          <input
                            type="number"
                            min="0"
                            step={
                              k === "weight" || k === "increment" ? ".5" : "1"
                            }
                            value={entry[k]}
                            onChange={(e) =>
                              changeEntry(entry.id, { [k]: +e.target.value })
                            }
                          />
                        </Field>
                      ))}
                      <Field label={`Progression · exercise ${i + 1}`}>
                        <select
                          value={entry.progression}
                          onChange={(e) =>
                            changeEntry(entry.id, {
                              progression: e.target
                                .value as StrengthExercise["progression"],
                            })
                          }
                        >
                          <option value="off">Manual / previous load</option>
                          <option value="linear">
                            Linear · all targets met
                          </option>
                          <option value="double">Double progression</option>
                          <option value="time">Add time</option>
                        </select>
                      </Field>
                      <Field
                        label={`Superset group · exercise ${i + 1}`}
                        hint="Use the same letter on adjacent exercises."
                      >
                        <input
                          maxLength={8}
                          value={entry.superset}
                          onChange={(e) =>
                            changeEntry(entry.id, { superset: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <p className="helper">
                      {prescriptionFor(db, entry).reason}
                    </p>
                  </div>
                </details>
              ))}
            </div>
            <Field label="Add exercise">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    setBuilder({
                      ...builder,
                      entries: [
                        ...builder.entries,
                        defaultEntry(e.target.value, builder.entries.length),
                      ],
                    });
                }}
              >
                <option value="">Choose from catalogue…</option>
                {all.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Template notes">
              <textarea
                value={builder.notes}
                onChange={(e) =>
                  setBuilder({ ...builder, notes: e.target.value })
                }
              />
            </Field>
            <div className="button-row wrap">
              <Button onClick={saveTemplate}>
                <Save size={15} />
                Save strength workout
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setBuilder({
                    ...builder,
                    id: uid(),
                    name: builder.name + " · copy",
                  });
                  toast("Template copy ready. Save to keep it.");
                }}
              >
                <Copy size={15} />
                Duplicate template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
