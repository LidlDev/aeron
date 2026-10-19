import { useState } from "react";
import {
  Check,
  MoreHorizontal,
  CalendarDays,
  Copy,
  Trash2,
  SkipForward,
  ArrowUpRight,
} from "lucide-react";
import { useApp, SportIcon, Button, Field, Modal } from "./ui";
import {
  type PlannedSession,
  colors,
  duration,
  estimateDistance,
  formatDistance,
  completeSession,
} from "./domain";
import {
  duplicateSession,
  removeSession,
  moveSession,
  skipSession,
} from "./session-actions";
export function SessionRow({
  session,
  showDate = false,
}: {
  session: PlannedSession;
  showDate?: boolean;
}) {
  const { db, setDb, toast, openWorkout, go } = useApp();
  const w = db.workouts[session.workoutId];
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState("");
  const [date, setDate] = useState(session.date);
  const act = (fn: () => void) => {
    try {
      fn();
      setMenu(false);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div
      className={`session-row ${session.status}`}
      style={{ "--sport": colors[w.sport] } as React.CSSProperties}
    >
      <button
        className="session-row-main"
        onClick={() => openWorkout(w.id, session.id)}
      >
        <span className="session-sport-icon">
          <SportIcon sport={w.sport} />
        </span>
        <div>
          <div className="session-row-eyebrow">
            {w.sport}
            {showDate
              ? ` · ${new Date(session.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`
              : ""}
            {session.coachProtected ? " · COACH ADAPTED" : ""}
          </div>
          <strong>{w.title}</strong>
          <p>
            <span>{Math.round(duration(w))} min</span>
            {w.sport !== "Strength" && (
              <>
                <i />{" "}
                {formatDistance(
                  estimateDistance(w),
                  db.athlete.preferences.units,
                )}
              </>
            )}
            <i />
            {w.sport === "Strength"
              ? "Strength & stability"
              : `Z${Math.max(...w.steps.map((s) => s.zone))}`}
            {w.sport === "Cycling" && (
              <>
                <i />
                {w.indoor ? "Indoor" : "Outdoor"}
              </>
            )}
            <i />
            {session.status}
          </p>
        </div>
      </button>
      <div className="session-row-actions">
        {session.status === "planned" ? (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Complete ${w.title}`}
            onClick={() =>
              act(() => {
                if (w.sport === "Strength") {
                  go(`/strength?session=${session.id}`);
                  return;
                }
                setDb((d) => completeSession(d, session.id));
                toast("Session completed. Training totals updated.");
              })
            }
          >
            <Check size={19} />
          </Button>
        ) : session.status === "completed" ? (
          <Check size={17} className="mint" />
        ) : (
          <SkipForward size={16} className="muted" />
        )}
        <button
          className="icon-button ghost"
          aria-label={`Actions for ${w.title}`}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          <MoreHorizontal size={18} />
        </button>
        {menu && (
          <div className="session-action-menu">
            <button
              onClick={() => {
                openWorkout(w.id, session.id);
                setMenu(false);
              }}
            >
              <ArrowUpRight size={14} />
              Details & edit
            </button>
            <button
              onClick={() => {
                setDialog("move");
                setMenu(false);
              }}
              disabled={session.status === "completed"}
            >
              <CalendarDays size={14} />
              Reschedule
            </button>
            <button
              onClick={() =>
                act(() => {
                  setDb((d) => duplicateSession(d, session.id));
                  toast("Planned session duplicated.");
                })
              }
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              disabled={session.status === "completed"}
              onClick={() =>
                act(() => {
                  setDb(skipSession(db, session.id));
                  toast("Session skipped. No training debt added.");
                })
              }
            >
              <SkipForward size={14} />
              Skip
            </button>
            <button
              onClick={() => {
                setDialog("delete");
                setMenu(false);
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
      {dialog && (
        <Modal
          open
          onClose={() => setDialog("")}
          title={
            dialog === "move"
              ? "Reschedule session"
              : "Delete calendar session?"
          }
          description={w.title}
        >
          <div className="dialog-body">
            {dialog === "move" ? (
              <>
                <Field label="Move workout to">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                <Button
                  onClick={() =>
                    act(() => {
                      setDb(moveSession(db, session.id, date));
                      setDialog("");
                      toast(
                        Object.values(db.sessions).filter(
                          (s) => s.date === date && s.status === "planned",
                        ).length >= 2
                          ? "Moved. This is a busy training day; check spacing."
                          : "Session moved.",
                      );
                    })
                  }
                >
                  Save new date
                </Button>
              </>
            ) : (
              <>
                <p>Recorded activity history will be preserved.</p>
                <div className="button-row">
                  <Button variant="outline" onClick={() => setDialog("")}>
                    Keep session
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      act(()=>{setDb(removeSession(db,session.id));setDialog('');toast('Calendar session removed. Recorded history retained.');});
                    }}
                  >
                    Delete session
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
