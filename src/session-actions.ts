import { type Database, uid } from "./domain";
export function removeSession(db: Database, id: string) {
  const sessions = { ...db.sessions };
  delete sessions[id];
  return {
    ...db,
    sessions,
    activities: Object.fromEntries(
      Object.entries(db.activities).map(([key, a]) => [
        key,
        a.sessionId === id ? { ...a, sessionId: undefined } : a,
      ]),
    ),
    plans: Object.fromEntries(
      Object.entries(db.plans).map(([key, p]) => [
        key,
        { ...p, sessionIds: p.sessionIds.filter((sid) => sid !== id) },
      ]),
    ),
  };
}
export function duplicateSession(db: Database, id: string) {
  const s = db.sessions[id];
  if (!s) throw new Error("Session not found.");
  const copy = {
    ...s,
    id: uid(),
    status: "planned" as const,
    coachProtected: false,
  };
  return { ...db, sessions: { ...db.sessions, [copy.id]: copy } };
}
export function moveSession(db: Database, id: string, date: string) {
  const s = db.sessions[id];
  if (!s || s.status === "completed")
    throw new Error("Only an uncompleted session can be rescheduled.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(new Date(date + "T12:00:00").getTime())
  )
    throw new Error("Choose a valid date.");
  return {
    ...db,
    sessions: { ...db.sessions, [id]: { ...s, date } },
    strengthLogs: Object.fromEntries(
      Object.entries(db.strengthLogs).map(([key, l]) => [
        key,
        l.sessionId === id && !l.completed ? { ...l, date } : l,
      ]),
    ),
  };
}
export function skipSession(db: Database, id: string) {
  const s = db.sessions[id];
  if (!s || s.status === "completed")
    throw new Error("Completed history cannot be skipped.");
  return {
    ...db,
    sessions: { ...db.sessions, [id]: { ...s, status: "skipped" as const } },
  };
}
