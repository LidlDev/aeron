import { useState, lazy } from "react";
import {
  Download,
  FileJson,
  Activity,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  useApp,
  PageTitle,
  Card,
  SectionTitle,
  Button,
  Field,
  Badge,
  Empty,
  dateLabel,
} from "./ui";
import { duration, hours, sports, demoImport, download, uid } from "./domain";
const VolumeChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.VolumeChart })),
);
const TrendChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.TrendChart })),
);
const DistributionChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.DistributionChart })),
);
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
        title="Integrations"
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
