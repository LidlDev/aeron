import { useState, lazy, Suspense, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Download,
  Upload,
  Watch,
  Link,
  FileJson,
  Activity,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  useApp,
  PageTitle,
  Card,
  SectionTitle,
  Button,
  Field,
  Badge,
  Stat,
  Empty,
  AeronScene,
  dateLabel,
} from "./ui";
import {
  today,
  addDays,
  monday,
  duration,
  hours,
  colors,
  sports,
  weeklyData,
  coachReply,
  decideRecommendation,
  demoImport,
  download,
  uid,
  type CoachMessage,
  type Sport,
} from "./domain";
const VolumeChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.VolumeChart })),
);
const TrendChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.TrendChart })),
);
const DistributionChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.DistributionChart })),
);
export function Coach() {
  const { db, setDb, toast } = useApp();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const prompts = [
    "How is my training progressing?",
    "Adjust my week because I’m feeling fatigued.",
    "I only have 45 minutes tomorrow.",
    "Can you explain my cycling progression?",
    "What should I focus on for my 70.3?",
    "Review my last four weeks.",
  ];
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [db.messages.length, busy]);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMessage("");
    setBusy(true);
    const result = coachReply(db, text);
    const user: CoachMessage = { id: uid(), role: "user", text };
    const response: CoachMessage = {
      id: uid(),
      role: "coach",
      text: result.text,
      recommendationId: result.recommendation?.id,
    };
    setDb((d) => ({
      ...d,
      messages: [...d.messages, user, response],
      recommendations: result.recommendation
        ? {
            ...d.recommendations,
            [result.recommendation.id]: result.recommendation,
          }
        : d.recommendations,
    }));
    setBusy(false);
  }
  function decide(id: string, action: "accepted" | "rejected" | "undone") {
    try {
      const next = decideRecommendation(db, id, action);
      setDb(next);
      toast(
        action === "accepted"
          ? "Calendar updated. You can undo this change."
          : action === "undone"
            ? "Original session restored."
            : "Suggestion rejected.",
      );
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="INTELLIGENCE IN YOUR CORNER"
        title="YOUR NEXT MOVE."
        description="A little perspective. A clearer path forward."
        action={
          <Badge>
            <span className="status-dot" />
            DEMO COACH
          </Badge>
        }
      />
      <div className="coach-layout">
        <Card className="chat-card">
          <div className="chat-header">
            <div className="coach-avatar">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>AERON Coach</h3>
              <p>Rule-based guidance · Grounded in your training</p>
            </div>
            <span className="status-dot" />
          </div>
          <div className="chat-messages">
            {!db.messages.length && (
              <div className="coach-welcome">
                <Sparkles size={30} />
                <h2>
                  The plan adapts.
                  <br />
                  The intent stays.
                </h2>
                <p>
                  I can review your training, help you make room for recovery,
                  and adjust upcoming sessions. Changes always start with your
                  approval.
                </p>
                <div className="suggested-prompts">
                  {prompts.map((p) => (
                    <button key={p} onClick={() => send(p)}>
                      {p}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {db.messages.map((m) => (
              <div className={`chat-message ${m.role}`} key={m.id}>
                <span className="eyebrow">
                  {m.role === "coach"
                    ? "AERON / DEMO COACH"
                    : db.athlete.name.toUpperCase()}
                </span>
                <p>{m.text}</p>
                {m.recommendationId &&
                  (() => {
                    const r = db.recommendations[m.recommendationId!];
                    if (!r) return null;
                    return (
                      <div className="recommendation">
                        <div className="eyebrow">PROPOSED CALENDAR CHANGE</div>
                        <h4>
                          {dateLabel(r.before.date)} · {r.workoutBefore.sport}
                        </h4>
                        <div className="change-comparison">
                          <div>
                            <small>CURRENT</small>
                            <p>{r.workoutBefore.title}</p>
                            <strong>{hours(duration(r.workoutBefore))}</strong>
                          </div>
                          <ArrowRight size={16} />
                          <div>
                            <small>PROPOSED</small>
                            <p>{r.workoutAfter.title}</p>
                            <strong className="lime">
                              {hours(duration(r.workoutAfter))}
                            </strong>
                          </div>
                        </div>
                        <Badge>{r.status.toUpperCase()}</Badge>
                        <div className="button-row">
                          {r.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => decide(r.id, "accepted")}
                              >
                                <Check size={14} />
                                Accept change
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => decide(r.id, "rejected")}
                              >
                                <X size={14} />
                                Reject
                              </Button>
                            </>
                          ) : r.status === "accepted" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => decide(r.id, "undone")}
                            >
                              <RotateCcw size={14} />
                              Undo adjustment
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            ))}
            {busy && <div role="status">Reviewing your training…</div>}
            <div ref={bottom} />
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(message);
            }}
          >
            <input
              aria-label="Message your coach"
              placeholder="What’s on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              size="icon"
              aria-label="Send message"
              type="submit"
              disabled={busy || !message.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="chat-disclaimer">
            Demo Coach uses deterministic rules, not generative AI. No external
            service is connected.
          </p>
        </Card>
        <div className="coach-context">
          <Card>
            <SectionTitle title="Your training context" />
            <div className="context-row">
              <span>Objective</span>
              <strong>{db.athlete.goal}</strong>
            </div>
            <div className="context-row">
              <span>Phase</span>
              <strong>Base building</strong>
            </div>
            <div className="context-row">
              <span>Weekly availability</span>
              <strong>{db.athlete.preferences.weeklyHours} hours</strong>
            </div>
            <div className="context-row">
              <span>Recent baseline</span>
              <strong>{db.athlete.preferences.baseline} hours</strong>
            </div>
            <div className="context-row">
              <span>Latest fatigue</span>
              <strong>
                {Object.values(db.recovery).sort((a, b) =>
                  b.date.localeCompare(a.date),
                )[0]?.fatigue || "—"}
                /5
              </strong>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Revision history" />
            {Object.values(db.revisions).length ? (
              Object.values(db.revisions)
                .reverse()
                .slice(0, 10)
                .map((r) => (
                  <div className="revision" key={r.id}>
                    <RotateCcw size={14} />
                    <div>
                      <p>{r.description}</p>
                      <small>{new Date(r.date).toLocaleString()}</small>
                    </div>
                  </div>
                ))
            ) : (
              <p className="muted">
                Accepted adjustments appear here. Every change can be reviewed
                and undone.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
export function Integrations() {
  const { db, setDb, toast, openWorkout } = useApp();
  const [tab, setTab] = useState("Garmin");
  const [selected, setSelected] = useState("running-4");
  const [prepared, setPrepared] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const w = db.workouts[selected] || Object.values(db.workouts)[0];
  const garminExports = Object.values(db.exports).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  function exportW() {
    download(`${w.title.replace(/[^a-z0-9]/gi, "-")}.json`, {
      format: "AERON structured workout JSON",
      version: 1,
      workout: w,
      totalMinutes: duration(w),
      garminCompatibleFIT: false,
    });
    const id = uid();
    setDb((d) => ({
      ...d,
      exports: {
        ...d.exports,
        [id]: {
          id,
          workoutId: w.id,
          date: new Date().toISOString(),
          format: "JSON",
          manual: false,
        },
      },
    }));
    toast("AERON workout JSON downloaded.");
  }
  return (
    <>
      <PageTitle
        eyebrow="YOUR TRAINING ECOSYSTEM"
        title="CONNECTED BY INTENT."
        description="Your tools, one training environment. Always clear about what’s connected."
      />
      <div className="segmented page-tabs">
        {["Garmin", "Strava"].map((s) => (
          <button
            key={s}
            className={tab === s ? "active" : ""}
            onClick={() => setTab(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {tab === "Garmin" ? (
        <>
          <div className="integration-hero card">
            <div>
              <div className="eyebrow">DEVICE PROFILE / SELECTED</div>
              <h2>
                FORERUNNER<span>265.</span>
              </h2>
              <Badge>NOT CONNECTED · MANUAL EXPORT</Badge>
              <p>Your endurance sessions, prepared for your wrist.</p>
              <div className="button-row">
                {sports.map((s) => (
                  <Badge key={s} sport={s}>
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div
              className="watch-visual"
              role="img"
              aria-label="Original watch-like illustration"
            >
              <div className="watch-strap" />
              <div className="watch-body">
                <span>AERON</span>
                <Activity size={28} />
                <strong>
                  TRAIN
                  <br />
                  <b>WITH INTENT.</b>
                </strong>
                <small>BASE / WEEK 01</small>
                <div className="watch-ring" />
              </div>
            </div>
          </div>
          <div className="two-col">
            <Card>
              <SectionTitle
                title="Prepare your next session"
                meta="DEMO WORKFLOW"
              />
              <Field label="Select a workout">
                <select
                  value={selected}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setPrepared(false);
                  }}
                >
                  {Object.values(db.workouts)
                    .slice(0, 80)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.sport} · {w.title}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="export-steps">
                {[
                  "Select workout",
                  "Preview structured steps",
                  "Prepare export",
                  "Download JSON / manual setup",
                  "Mark manual transfer",
                ].map((s, i) => (
                  <div className={i < 2 || prepared ? "ready" : ""} key={s}>
                    <span>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
              <h3>{w.title}</h3>
              <div className="structured-preview">
                {w.steps.map((s) => (
                  <div key={s.id}>
                    <span>
                      {s.reps > 1 ? `${s.reps} × ` : ""}
                      {s.name}
                    </span>
                    <strong>{s.minutes.toFixed(0)} min</strong>
                    <small>{s.target}</small>
                  </div>
                ))}
              </div>
              <div className="button-row wrap">
                <Button variant="outline" onClick={() => openWorkout(w.id)}>
                  Full preview
                </Button>
                <Button
                  onClick={() => {
                    setPrepared(true);
                    toast(
                      "Export prepared. Choose JSON download or manual setup below.",
                    );
                  }}
                >
                  <FileJson size={15} />
                  Prepare export
                </Button>
                {prepared && (
                  <Button onClick={exportW}>
                    <Download size={15} />
                    Download JSON
                  </Button>
                )}
              </div>
              <p className="helper">
                JSON is a readable AERON workout definition. It is not a
                Garmin-compatible FIT file and has not been sent to Garmin.
              </p>
            </Card>
            <Card>
              <SectionTitle title="Manual transfer guide" />
              <ol className="technique">
                <li>
                  In Garmin Connect, open Training & Planning → Workouts →
                  Create a Workout.
                </li>
                <li>
                  Choose the discipline and recreate each interval, recovery,
                  target, and repetition.
                </li>
                <li>
                  Save the workout. Use Garmin Connect’s Send to Device option
                  and choose Forerunner 265.
                </li>
                <li>
                  Sync the watch in Garmin Connect, then verify the workout is
                  available on your watch.
                </li>
              </ol>
              <SectionTitle title="Export history" />
              {garminExports.length ? (
                garminExports.map((e) => (
                  <div className="export-history" key={e.id}>
                    <FileJson size={17} />
                    <div>
                      <strong>
                        {db.workouts[e.workoutId]?.title || "Exported workout"}
                      </strong>
                      <small>JSON · {new Date(e.date).toLocaleString()}</small>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={e.manual}
                      onClick={() => {
                        setDb((d) => ({
                          ...d,
                          exports: {
                            ...d.exports,
                            [e.id]: { ...e, manual: true },
                          },
                        }));
                        toast(
                          "Marked manually transferred. This is not verified device synchronization.",
                        );
                      }}
                    >
                      {e.manual ? "Manually marked" : "Mark transferred"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="muted">
                  Your downloaded definitions will appear here.
                </p>
              )}
              <div className="setup-state">
                <ShieldCheck size={20} />
                <p>
                  Real Garmin sync requires approved server-side integration. No
                  Garmin credentials are collected. Last verified
                  synchronization: never.
                </p>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <div className="two-col">
          <Card className="strava-card">
            <div className="strava-symbol">⟋</div>
            <div className="eyebrow">ACTIVITY CONNECTION</div>
            <h2>
              THE WORK.
              <br />
              ALL TOGETHER.
            </h2>
            <Badge>
              {db.integrations.strava.status === "Demo"
                ? "DEMO DATA IMPORTED"
                : "NOT CONNECTED"}
            </Badge>
            <p>
              Explore an activity import with three fictional rides. Importing
              again keeps your history free of duplicates.
            </p>
            <Button
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                setDb((d) => demoImport(d));
                setSyncing(false);
                toast(
                  "Demo import complete. Stable activity IDs prevent duplicates.",
                );
              }}
            >
              <Download size={16} />
              {syncing ? "Importing…" : "Demo Import"}
            </Button>
            <p className="helper">
              No real Strava account is authorized or connected.
            </p>
            <div className="context-row">
              <span>Demo imports</span>
              <strong>{db.integrations.strava.imports} activities</strong>
            </div>
            <div className="context-row">
              <span>Last demo import</span>
              <strong>
                {db.integrations.strava.lastSync
                  ? new Date(db.integrations.strava.lastSync).toLocaleString()
                  : "Never"}
              </strong>
            </div>
            <div className="setup-state">
              <AlertCircle size={20} />
              <p>
                Live OAuth is not configured. A production adapter requires
                server-side token storage, refresh handling, webhook
                verification, and deduplicated imports. No client-side secrets
                are used.
              </p>
            </div>
          </Card>
          <Card>
            <SectionTitle title="Demo imported activities" />
            {Object.values(db.activities)
              .filter((a) => a.source === "Strava demo")
              .map((a) => (
                <div className="journal-row" key={a.id}>
                  <Badge sport="Cycling">STRAVA DEMO · CYCLING</Badge>
                  <h3>{db.workouts[a.workoutId].title}</h3>
                  <p>
                    {dateLabel(a.date)} · {a.distance.toFixed(1)} km ·{" "}
                    {hours(a.minutes)}
                  </p>
                  <small className="mono">{a.id}</small>
                </div>
              ))}
            {!db.integrations.strava.imports && (
              <Empty
                title="Ready when you are"
                description="Run the demo import to populate this list and your analytics."
              />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
