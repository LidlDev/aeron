import { type Workout, duration, colors } from "./domain";
export function IntervalTimeline({ w }: { w: Workout }) {
  const total = duration(w);
  return (
    <div className="interval-wrap">
      <div className="interval-timeline" aria-label="Workout interval timeline">
        {w.steps.flatMap((s) =>
          Array.from({ length: Math.min(s.reps, 30) }, (_, i) => (
            <div
              key={s.id + i}
              title={`${s.name} · ${s.minutes.toFixed(1)} min · ${s.target}`}
              style={{
                flex: Math.max(0.2, s.minutes),
                height: `${25 + s.zone * 13}%`,
                background: colors[w.sport],
                opacity: 0.35 + s.zone * 0.12,
              }}
            />
          )),
        )}
      </div>
      <div className="timeline-labels">
        <span>0:00</span>
        <span>{Math.round(total / 2)}:00</span>
        <span>{Math.round(total)}:00</span>
      </div>
    </div>
  );
}
