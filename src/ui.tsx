import {
  createContext,
  useId,
  Children,
  isValidElement,
  cloneElement,
  type ReactElement,
  useContext,
  useState,
  useCallback,
  useEffect,
  Component,
  lazy,
  Suspense,
  type ReactNode,
  type ErrorInfo,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ArrowUpRight,
  Activity,
  Bike,
  Waves,
  Dumbbell,
  Check,
  AlertCircle,
} from "lucide-react";
import { motion, MotionConfig } from "framer-motion";
import {
  type Database,
  type Workout,
  type Sport,
  storage,
  colors,
  hours,
  duration,
  estimateDistance,
  formatDistance,
  today,
} from "./domain";
export { Button } from "./components/ui/button";
export const SportIcon = ({
  sport,
  size = 18,
}: {
  sport: Sport;
  size?: number;
}) => {
  const Icon =
    sport === "Cycling"
      ? Bike
      : sport === "Swimming"
        ? Waves
        : sport === "Strength"
          ? Dumbbell
          : Activity;
  return <Icon size={size} />;
};
export function Logo({
  compact = false,
  mono = false,
}: {
  compact?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`logo ${mono ? "mono" : ""}`}>
      <svg viewBox="0 0 44 44" width="36" height="36" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 33 16-25 16 25" />
          <path d="m14 33 8-13 8 13" />
          <path d="M10 26h24" />
        </g>
      </svg>
      {!compact && (
        <span>
          AERON<span className="logo-dot">®</span>
        </span>
      )}
    </div>
  );
}
interface Store {
  db: Database;
  setDb: (value: Database | ((d: Database) => Database)) => void;
  toast: (s: string) => void;
  openWorkout: (id: string, sessionId?: string, date?: string) => void;
  go: (s: string) => void;
}
export const AppContext = createContext<Store>(null!);
export const useApp = () => useContext(AppContext);
export function useDatabase() {
  const [initial] = useState(() => storage.load());
  const [db, setData] = useState(initial.data);
  const [notice, setNotice] = useState(initial.warning);
  const setDb = useCallback(
    (next: Database | ((d: Database) => Database)) =>
      setData((d) => {
        const value = typeof next === "function" ? next(d) : next;
        try {
          storage.save(value);
        } catch {
          setNotice(
            "Could not save to browser storage. Please export a backup in Settings.",
          );
        }
        return value;
      }),
    [],
  );
  return { db, setDb, notice, setNotice };
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`dialog-content ${wide ? "wide" : ""}`}>
          <header className="dialog-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description || "AERON · Train with intent."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="icon-button ghost"
              aria-label="Close dialog"
            >
              <X size={20} />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const control = Children.map(children, (child) => {
    if (
      isValidElement(child) &&
      typeof child.type === "string" &&
      ["input", "select", "textarea"].includes(child.type)
    ) {
      return cloneElement(child as ReactElement<Record<string, unknown>>, {
        id,
        "aria-label": label,
      });
    }
    return child;
  });
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">
          <span className="tiny-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`card ${className}`} style={style}>
      {children}
    </section>
  );
}
export function SectionTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>
        {title}
        {meta && <span>{meta}</span>}
      </h2>
      {action}
    </div>
  );
}
export function Badge({
  children,
  sport,
}: {
  children: ReactNode;
  sport?: Sport;
}) {
  return (
    <span
      className="badge"
      style={
        sport
          ? { color: colors[sport], background: `${colors[sport]}13` }
          : undefined
      }
    >
      {children}
    </span>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Activity size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Stat({
  label,
  value,
  unit,
  sub,
  accent = false,
  children,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className="stat">
      <span className="eyebrow">{label}</span>
      <div className={`stat-value ${accent ? "lime" : ""}`}>
        {value}
        <small>{unit}</small>
      </div>
      <div className="stat-bottom">
        <span>{sub}</span>
        {children}
      </div>
    </Card>
  );
}
export function WorkoutCard({
  w,
  sessionId,
  compact = false,
}: {
  w: Workout;
  sessionId?: string;
  compact?: boolean;
}) {
  const { db, openWorkout } = useApp();
  const s = sessionId ? db.sessions[sessionId] : undefined;
  return (
    <button
      className={`workout-card ${compact ? "compact" : ""}`}
      onClick={() => openWorkout(w.id, sessionId)}
      style={{ "--sport": colors[w.sport] } as React.CSSProperties}
    >
      <div className="workout-icon">
        <SportIcon sport={w.sport} />
      </div>
      <div className="workout-copy">
        <div className="eyebrow" style={{ color: colors[w.sport] }}>
          {w.sport}{" "}
          <span>· {s?.status === "completed" ? "COMPLETED" : w.objective}</span>
        </div>
        <h3>{w.title}</h3>
        <p>
          {hours(duration(w))} <span>·</span>{" "}
          {w.sport === "Strength"
            ? "Strength & stability"
            : formatDistance(
                estimateDistance(w),
                db.athlete.preferences.units,
              )}{" "}
          <span>·</span> {w.difficulty}
        </p>
      </div>
      {s?.status === "completed" ? (
        <Check size={18} className="mint" />
      ) : (
        <ArrowUpRight size={18} />
      )}
    </button>
  );
}
const Scene = lazy(() => import("./Scene"));
export function AeronScene({
  variant = "hero",
  sport = "Cycling",
  values = [],
  value = 4,
}: {
  variant?: "hero" | "orb" | "terrain" | "journey" | "recovery";
  sport?: Sport;
  values?: number[];
  value?: number;
}) {
  const { db } = useApp();
  return (
    <ErrorBoundary fallback={<SceneFallback />}>
      <Suspense fallback={<SceneFallback />}>
        <Scene
          variant={variant}
          sport={sport}
          values={values}
          value={value}
          reduced={db.athlete.preferences.reducedMotion}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
export function SceneFallback() {
  return (
    <div
      className="scene-fallback"
      role="img"
      aria-label="Three aerodynamic arcs converging into the AERON symbol"
    >
      <i />
      <i />
      <i />
    </div>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AERON boundary", error.message, info.componentStack);
  }
  render() {
    return this.state.error
      ? this.props.fallback || (
          <div className="empty">
            <AlertCircle />
            <h2>This view needs a fresh start.</h2>
            <p>Your saved training data is kept in browser storage.</p>
            <button
              className="button primary"
              onClick={() => location.reload()}
            >
              Reload AERON
            </button>
          </div>
        )
      : this.props.children;
  }
}
export function AppMotion({ children }: { children: ReactNode }) {
  const { db } = useApp();
  return (
    <MotionConfig
      reducedMotion={db.athlete.preferences.reducedMotion ? "always" : "user"}
    >
      {children}
    </MotionConfig>
  );
}
export function Fade({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {children}
    </motion.div>
  );
}
export function useTimer(active: boolean, callback: () => void) {
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(callback, 1000);
    return () => clearInterval(timer);
  }, [active, callback]);
}
export function dateLabel(date = today()) {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
