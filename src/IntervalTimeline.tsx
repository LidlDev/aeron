import { type Workout, duration, distance, colors } from "./domain";
import { useApp } from "./ui";
import { profilePoints, powerRange, timeInZone } from "./workout-math";
export function IntervalTimeline({ w }: { w: Workout }) {
  const { db } = useApp();
  const total = duration(w);
  if (w.sport === "Strength") {
    const t = db.strengthWorkouts[w.strengthTemplateId || "A"];
    return (
      <div className="strength-structure-preview">
        <span>{t?.entries.length || 0} exercises</span>
        <span>
          {t?.entries.reduce((n, e) => n + e.sets, 0) || 0} working sets
        </span>
        <span>Editable log</span>
      </div>
    );
  }
  if (w.sport === "Swimming")
    return (
      <div className="swim-structure">
        <div className="swim-total">
          <strong>
            {distance(w).toLocaleString()}
            <small>m</small>
          </strong>
          <span>
            {w.poolLength || 25}m pool · {w.steps.length} sets
          </span>
        </div>
        <div className="swim-set-lanes">
          {w.steps.map((s, i) => (
            <div key={s.id}>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>
                  {s.reps} ×{" "}
                  {s.distance
                    ? s.distance + "m"
                    : Math.round(s.minutes) + "min"}{" "}
                  <span>{s.name}</span>
                </strong>
                <p>
                  {s.target}
                  {s.rest && s.reps > 1
                    ? ` · ${Math.round(s.rest)}s rest between reps`
                    : ""}
                </p>
              </div>
              <b>{s.distance * s.reps}m</b>
            </div>
          ))}
        </div>
      </div>
    );
  const points = profilePoints(w);
  return (
    <div
      className={`interval-wrap sport-profile ${w.sport.toLowerCase()}-profile`}
    >
      <div className="profile-title">
        <span>
          {w.sport === "Cycling"
            ? "POWER / EFFORT PROFILE"
            : "WORK / RECOVERY PROFILE"}
        </span>
        <span>
          {w.sport === "Cycling"
            ? `FTP ${db.zones.ftp} W`
            : "Intensity zones · Z1–Z5"}
        </span>
      </div>
      <div className="profile-plot">
        <div className="profile-y-axis">
          {w.sport === "Cycling" ? (
            <>
              <span>120% FTP</span>
              <span>60% FTP</span>
              <span>Recovery</span>
            </>
          ) : (
            <>
              <span>Z5</span>
              <span>Z3</span>
              <span>Z1</span>
            </>
          )}
        </div>
        <div
          className="interval-timeline"
          role="img"
          aria-label={`${w.sport} profile. ${points.map((s) => `${s.label}: ${s.minutes.toFixed(1)} minutes in zone ${s.zone}`).join("; ")}`}
        >
          {points.map((s, i) => {
            const power = powerRange(s, db.zones.ftp);
            return (
              <div
                key={s.id + "-" + i}
                tabIndex={0}
                title={`${s.label} · ${s.start.toFixed(1)}–${s.end.toFixed(1)} min · ${s.target}${power ? ` · ${power[0]}–${power[1]} W` : ""}`}
                style={{
                  flex: Math.max(0.01, s.minutes),
                  height: `${s.isRest ? 13 : 18 + s.zone * 15}%`,
                  background: colors[w.sport],
                  opacity: s.isRest ? 0.2 : 0.4 + s.zone * 0.12,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="timeline-labels">
        <span>0 min</span>
        <span>{(total / 2).toFixed(0)} min</span>
        <span>{total.toFixed(0)} min</span>
      </div>
      <div className="zone-duration">
        {timeInZone(w)
          .filter((z) => z.minutes > 0)
          .map((z) => (
            <span key={z.zone}>
              Z{z.zone} <b>{z.minutes.toFixed(0)}m</b>
            </span>
          ))}
      </div>
      {w.sport === "Running" && (
        <p className="profile-context">
          Pace / HR / RPE targets are defined per step. Threshold pace setting:{" "}
          {Math.floor(db.zones.thresholdPace / 60)}:
          {String(db.zones.thresholdPace % 60).padStart(2, "0")} /km.
        </p>
      )}
      {w.sport === "Cycling" && (
        <p className="profile-context">
          {w.indoor ? "Indoor trainer" : "Outdoor ride"} ·{" "}
          {w.steps
            .filter((s) => powerRange(s, db.zones.ftp))
            .map((s) => {
              const p = powerRange(s, db.zones.ftp)!;
              return `${s.name}: ${p[0]}–${p[1]} W`;
            })
            .join(" · ") || "Power targets follow the defined effort zones."}
        </p>
      )}
    </div>
  );
}
