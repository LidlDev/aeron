import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  useApp,
  PageTitle,
  Card,
  SectionTitle,
  Button,
  Badge,
  dateLabel,
} from "./ui";
import {
  coachReply,
  decideRecommendation,
  uid,
  duration,
  hours,
  today,
  addDays,
  type CoachMessage,
} from "./domain";
import { trainingSummary, latestCheckin, phaseLabel } from "./metrics";
export function Coach() {
  const { db, setDb, toast, openWorkout } = useApp();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const week = trainingSummary(db);
  const month = trainingSummary(db, addDays(today(), -27), today());
  const check = latestCheckin(db);
  const recs = Object.values(db.recommendations).reverse();
  const prompts = [
    "How is my training progressing?",
    "Adjust my week because I’m feeling fatigued.",
    "I only have 45 minutes tomorrow.",
    "Review my last four weeks.",
  ];
  function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    const result = coachReply(db, text);
    const messages: CoachMessage[] = [
      { id: uid(), role: "user", text },
      {
        id: uid(),
        role: "coach",
        text: result.text,
        recommendationId: result.recommendation?.id,
      },
    ];
    const r = result.recommendation;
    setDb((d) => ({
      ...d,
      messages: [...d.messages, ...messages],
      workouts: r
        ? { ...d.workouts, [r.workoutAfter.id]: r.workoutAfter }
        : d.workouts,
      recommendations: r
        ? { ...d.recommendations, [r.id]: r }
        : d.recommendations,
      revisions: r
        ? {
            ...d.revisions,
            [`proposed-${r.id}`]: {
              id: `proposed-${r.id}`,
              date: new Date().toISOString(),
              recommendationId: r.id,
              state: "Proposed",
              description: "Rule-based adaptation proposed",
            },
          }
        : d.revisions,
    }));
    if (r) setExpanded(r.id);
    setMessage("");
    setBusy(false);
  }
  function decide(id: string, action: "accepted" | "rejected" | "undone") {
    try {
      setDb(decideRecommendation(db, id, action));
      toast(
        action === "accepted"
          ? "Approved and applied. Calendar updated."
          : action === "undone"
            ? "Change reverted. Original session restored."
            : "Proposal rejected.",
      );
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="DEMO COACH / TRAINING DECISIONS"
        title="Training decision center"
        description="Evidence first. Changes only with your approval."
        action={
          <Badge>
            <Sparkles size={13} />
            Rule-based demo
          </Badge>
        }
      />
      <div className="decision-assessment">
        <div>
          <span className="eyebrow">WEEKLY ASSESSMENT</span>
          <h2>
            {check && check.date >= addDays(today(), -7) && check.fatigue >= 4
              ? "Make room for recovery."
              : "Keep the work repeatable."}
          </h2>
          <p>
            {phaseLabel(db)}. You’ve recorded {hours(week.completedMinutes)}{" "}
            this week against {hours(week.plannedMinutes)} scheduled. Over 28
            days, {month.done} of {month.due} scheduled sessions are complete.
          </p>
        </div>
        <div className="decision-evidence">
          <div>
            <span>RECORDED FATIGUE</span>
            <strong>{check ? `${check.fatigue}/5` : "—"}</strong>
            <small>{check ? dateLabel(check.date) : "No check-in"}</small>
          </div>
          <div>
            <span>RECORDED SLEEP</span>
            <strong>{check ? `${check.sleep.toFixed(1)}h` : "—"}</strong>
            <small>Self-reported</small>
          </div>
          <div>
            <span>28-DAY ADHERENCE</span>
            <strong>
              {month.adherence == null ? "—" : month.adherence + "%"}
            </strong>
            <small>
              {month.done}/{month.due} sessions
            </small>
          </div>
        </div>
      </div>
      <div className="two-col decision-columns">
        <section>
          <SectionTitle
            title="Recommended adaptations"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  send("Adjust my week because I’m feeling fatigued.")
                }
                disabled={busy}
              >
                <Sparkles size={14} />
                Review next session
              </Button>
            }
          />
          {recs.length ? (
            recs.map((r) => (
              <Card className="decision-card" key={r.id}>
                <div className="button-row spread">
                  <span className="eyebrow">{r.lifecycle || r.status}</span>
                  <span className="small-text muted">
                    {dateLabel(r.before.date)} · {r.workoutBefore.sport}
                  </span>
                </div>
                <h3>{r.trigger || "Training adjustment"}</h3>
                <p>{r.reason || r.text}</p>
                <div className="decision-change">
                  <div>
                    <span>CURRENT</span>
                    <button onClick={() => openWorkout(r.workoutBefore.id)}>
                      {r.workoutBefore.title}
                    </button>
                    <strong>{hours(duration(r.workoutBefore))}</strong>
                  </div>
                  <ArrowRight size={18} />
                  <div>
                    <span>PROPOSED</span>
                    <button onClick={() => openWorkout(r.workoutAfter.id)}>
                      {r.workoutAfter.title}
                    </button>
                    <strong className="lime">
                      {hours(duration(r.workoutAfter))}
                    </strong>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  {expanded === r.id
                    ? "Hide evidence"
                    : "Preview evidence & change"}
                </Button>
                {expanded === r.id && (
                  <div className="recommendation-evidence">
                    <h4>Supporting data</h4>
                    <ul>
                      {(
                        r.evidence || [
                          "Legacy proposal. Refer to the recorded session snapshot.",
                        ]
                      ).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    <h4>Expected effect</h4>
                    <p>
                      {r.expectedEffect ||
                        "A lighter upcoming training demand."}
                    </p>
                    <h4>Confidence & uncertainty</h4>
                    <p>
                      {r.confidence ||
                        "Deterministic suggestion based on limited training data."}
                    </p>
                    <p className="helper">
                      Snapshot validation checks that the session has not
                      changed or completed. Approval applies one reversible
                      revision; recorded activity history is preserved.
                    </p>
                  </div>
                )}
                <div className="button-row wrap">
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
                        variant="outline"
                        size="sm"
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
                  ) : (
                    <span className="muted small-text">
                      {r.lifecycle || r.status}. No active calendar change.
                    </span>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="decision-empty">
              <ShieldCheck size={25} />
              <h3>No pending changes.</h3>
              <p>
                Keep the current plan, or request a review when fatigue or
                availability changes. Nothing is changed automatically.
              </p>
            </div>
          )}
        </section>
        <aside>
          <Card>
            <SectionTitle title="Current priorities" />
            <ol className="training-priorities">
              <li>
                <strong>Protect consistency</strong>
                <p>
                  Return to the next planned session after missed training. No
                  catch-up debt.
                </p>
              </li>
              <li>
                <strong>Respect your recovery signals</strong>
                <p>
                  {check
                    ? `Latest check-in: ${check.date}, fatigue ${check.fatigue}/5 and sleep ${check.sleep.toFixed(1)}h.`
                    : "Record a check-in to add context to the plan."}
                </p>
              </li>
              <li>
                <strong>Keep strength integrated</strong>
                <p>
                  {db.athlete.preferences.strengthSessions} strength sessions
                  weekly within {db.athlete.preferences.weeklyHours}h available
                  capacity.
                </p>
              </li>
            </ol>
          </Card>
          <Card>
            <SectionTitle title="Revision history" />
            {Object.values(db.revisions).length ? (
              <div className="revision-timeline">
                {Object.values(db.revisions)
                  .slice(-12)
                  .reverse()
                  .map((r) => (
                    <div key={r.id}>
                      <i />
                      <div>
                        <strong>{r.state || r.description}</strong>
                        <p>{r.description}</p>
                        <small>{new Date(r.date).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted small-text">
                Proposed → Validated → Approved/Rejected → Applied → Reverted.
              </p>
            )}
          </Card>
        </aside>
      </div>
      <section className="coach-conversation">
        <SectionTitle
          title="Ask your Demo Coach"
          meta="RULE-BASED · NO EXTERNAL AI"
        />
        <div className="coach-quick-prompts">
          {prompts.map((p) => (
            <button key={p} onClick={() => send(p)}>
              {p}
              <ArrowRight size={13} />
            </button>
          ))}
        </div>
        <div className="decision-chat-history">
          {db.messages.slice(-6).map((m) => (
            <div key={m.id} className={m.role}>
              <span className="eyebrow">
                {m.role === "coach" ? "AERON / DEMO COACH" : db.athlete.name}
              </span>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
        <form
          className="decision-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(message);
          }}
        >
          <input
            aria-label="Message your coach"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What changed in your training day?"
          />
          <Button
            type="submit"
            aria-label="Send message"
            disabled={busy || !message.trim()}
          >
            <Send size={16} />
            Send
          </Button>
        </form>
        <p className="helper">
          Deterministic rules use your saved data. They do not predict injury,
          diagnose fatigue, or replace professional guidance.
        </p>
      </section>
    </>
  );
}
