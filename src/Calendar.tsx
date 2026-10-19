import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApp, PageTitle, Button, dateLabel } from "./ui";
import {
  today,
  monday,
  addDays,
  dateKey,
  duration,
  hours,
  colors,
  sports,
} from "./domain";
import { SessionRow } from "./SessionRow";
import { moveSession } from "./session-actions";
export function Calendar() {
  const { db, setDb, toast, openWorkout } = useApp();
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  const [selected, setSelected] = useState(query.get("date") || today());
  const [view, setView] = useState("Week");
  const [agenda, setAgenda] = useState("Day");
  const [sport, setSport] = useState("All disciplines");
  const start = monday(selected);
  const monthStart = selected.slice(0, 7) + "-01";
  const gridStart = view === "Month" ? monday(monthStart) : start;
  const count = view === "Month" ? 42 : 7;
  const ss = Object.values(db.sessions).filter(
    (s) =>
      !s.archived &&
      (sport === "All disciplines" || db.workouts[s.workoutId].sport === sport),
  );
  const week = ss.filter((s) => s.date >= start && s.date < addDays(start, 7));
  const chosen = ss
    .filter((s) =>
      agenda === "Week"
        ? s.date >= start && s.date < addDays(start, 7)
        : s.date === selected,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const day = ss.filter((s) => s.date === selected);
  const weekActivities = Object.values(db.activities).filter(
    (a) =>
      a.date >= start &&
      a.date < addDays(start, 7) &&
      (sport === "All disciplines" || db.workouts[a.workoutId].sport === sport),
  );
  const planned = week.reduce(
    (n, s) => n + duration(db.workouts[s.workoutId]),
    0,
  );
  const completed = weekActivities.reduce((n, a) => n + a.minutes, 0);
  function period(dir: number) {
    if (view === "Week") setSelected(addDays(selected, dir * 7));
    else {
      const d = new Date(selected + "T12:00:00");
      d.setDate(1);
      d.setMonth(d.getMonth() + dir);
      setSelected(dateKey(d));
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="SCHEDULE / BASE BLOCK"
        title="Training calendar"
        description={
          db.athlete.raceDate
            ? `Race objective · ${db.athlete.raceDate}`
            : "Base building — race not selected"
        }
        action={
          <Button onClick={() => openWorkout("new", undefined, selected)}>
            <Plus size={15} />
            Add workout
          </Button>
        }
      />
      <div className="calendar-toolbar">
        <div className="button-row">
          <Button
            size="icon"
            variant="outline"
            aria-label="Previous period"
            onClick={() => period(-1)}
          >
            <ChevronLeft size={17} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Next period"
            onClick={() => period(1)}
          >
            <ChevronRight size={17} />
          </Button>
          <h3>
            {view === "Week"
              ? `${dateLabel(start)} — ${dateLabel(addDays(start, 6))}`
              : new Date(monthStart + "T12:00:00").toLocaleDateString(
                  undefined,
                  { month: "long", year: "numeric" },
                )}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(today())}
          >
            Today
          </Button>
        </div>
        <div className="button-row">
          <select
            aria-label="Filter discipline"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option>All disciplines</option>
            {sports.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="segmented">
            {["Week", "Month"].map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="calendar-progress">
        <strong>
          {hours(completed)} <span>/ {hours(planned)}</span>
        </strong>
        <progress value={completed} max={Math.max(1, planned)} />
        <span>{week.length} sessions planned this week</span>
      </div>
      <div
        className={`calendar-selector ${view === "Month" ? "month-selector" : ""}`}
      >
        {Array.from({ length: count }, (_, i) => {
          const d = addDays(gridStart, i);
          const sessions = ss.filter((s) => s.date === d);
          return (
            <button
              className={`${d === selected ? "selected" : ""} ${d === today() ? "today" : ""} ${view === "Month" && !d.startsWith(monthStart.slice(0, 7)) ? "outside-month" : ""}`}
              key={d}
              aria-label={`Select ${d}`}
              aria-pressed={d === selected}
              onClick={() => {
                setSelected(d);
                setAgenda("Day");
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const id = e.dataTransfer.getData("aeron/session");
                  setDb(moveSession(db, id, d));
                  toast("Session moved.");
                } catch (error) {
                  toast((error as Error).message);
                }
              }}
            >
              <span>
                {new Date(d + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
              <strong>{new Date(d + "T12:00:00").getDate()}</strong>
              <div className="day-dots">
                {sessions.map((s) => (
                  <i
                    key={s.id}
                    style={{
                      background: colors[db.workouts[s.workoutId].sport],
                      opacity: s.status === "skipped" ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>
              <small>
                {sessions.length
                  ? `${Math.round(sessions.reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0))}m`
                  : "Rest"}
              </small>
            </button>
          );
        })}
      </div>
      <div className="selected-day-summary">
        <div>
          <span className="eyebrow">SELECTED DAY</span>
          <h2>{dateLabel(selected)}</h2>
          <p>
            {day.length} sessions ·{" "}
            {hours(
              day
                .filter((s) => s.origin !== "import")
                .reduce((n, s) => n + duration(db.workouts[s.workoutId]), 0),
            )}{" "}
            planned · {day.filter((s) => s.status === "completed").length}{" "}
            completed
          </p>
        </div>
        <div className="segmented">
          {["Day", "Week"].map((v) => (
            <button
              key={v}
              onClick={() => setAgenda(v)}
              aria-label={v === "Day" ? "Selected day" : "Week agenda"}
              className={agenda === v ? "active" : ""}
            >
              {v === "Day" ? "Day" : "Week"}
            </button>
          ))}
        </div>
      </div>
      {day.filter((s) => s.status === "planned").length > 2 && (
        <p className="conflict-note">
          Three or more sessions share this day. Review transitions, fueling and
          recovery time.
        </p>
      )}
      <div className="calendar-agenda">
        {chosen.length ? (
          chosen.map((s) => (
            <div
              key={s.id}
              draggable={s.status === "planned"}
              onDragStart={(e) => e.dataTransfer.setData("aeron/session", s.id)}
            >
              <SessionRow session={s} showDate={agenda === "Week"} />
            </div>
          ))
        ) : (
          <div className="calendar-rest">
            <span className="eyebrow mint">REST & RESET</span>
            <h3>No sessions scheduled.</h3>
            <p>
              Keep the recovery day, or add a workout when your availability
              changes.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openWorkout("new", undefined, selected)}
            >
              <Plus size={14} />
              Add session
            </Button>
          </div>
        )}
      </div>
      <p className="helper">
        Open a session’s actions to reschedule, duplicate or skip. On desktop,
        drag a planned session onto a day above.
      </p>
    </>
  );
}
