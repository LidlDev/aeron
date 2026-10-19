import React, { useState, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Layers,
  Library,
  Activity,
  Bike,
  Waves,
  Dumbbell,
  Utensils,
  Heart,
  ChartNoAxesCombined,
  Sparkles,
  Link,
  Settings as SettingsIcon,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  AppContext,
  useDatabase,
  Logo,
  Button,
  Modal,
  AppMotion,
  ErrorBoundary,
  Fade,
  Badge,
  dateLabel,
} from "./ui";
import { Plans, Library as WorkoutLibrary } from "./Training";
import { Nutrition, Recovery } from "./Wellness";
import { Strength } from "./Strength";
import { Overview } from "./Dashboard";
import { Calendar } from "./Calendar";
import { Integrations } from "./Intelligence";
import { Coach } from "./Coach";
import { Settings, Onboarding } from "./Profile";
import { today, duration, storage } from "./domain";
import "./styles.css";
import "./v2.css";
const Analytics = lazy(() =>
  import("./Analytics").then((m) => ({ default: m.Analytics })),
);
const WorkoutDialog = lazy(() => import("./WorkoutDialog"));
const nav = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Training Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Training Plans", path: "/plans", icon: Layers },
  { label: "Workout Library", path: "/library", icon: Library },
  { label: "Running", path: "/running", icon: Activity, sport: "Running" },
  { label: "Cycling", path: "/cycling", icon: Bike, sport: "Cycling" },
  { label: "Swimming", path: "/swimming", icon: Waves, sport: "Swimming" },
  { label: "Strength", path: "/strength", icon: Dumbbell, sport: "Strength" },
  { label: "Nutrition", path: "/nutrition", icon: Utensils },
  { label: "Recovery", path: "/recovery", icon: Heart },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
  { label: "AI Coach", path: "/coach", icon: Sparkles },
  { label: "Integrations", path: "/integrations", icon: Link },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];
function App() {
  const { db, setDb, notice, setNotice } = useDatabase();
  const [toastMessage, setToast] = useState("");
  const [workout, setWorkout] = useState<{
    id?: string;
    sessionId?: string;
    date?: string;
  } | null>(null);
  const [search, setSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const go = (s: string) => {
    navigate(s);
    setDrawer(false);
  };
  const openWorkout = (id: string, sessionId?: string, date?: string) =>
    setWorkout({ id: id === "new" ? undefined : id, sessionId, date });
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.dataset.reduced = db.athlete.preferences
      .reducedMotion
      ? "true"
      : "false";
  }, [db.athlete.preferences.reducedMotion]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const onboard = location.pathname === "/onboarding";
  const block = Object.values(db.plans).at(-1);
  const blockWeek = block
    ? Math.max(
        1,
        Math.min(
          4,
          Math.floor(
            (new Date(today() + "T12:00:00").getTime() -
              new Date(block.start + "T12:00:00").getTime()) /
              604800000,
          ) + 1,
        ),
      )
    : 1;
  const upcoming = Object.values(db.sessions)
    .filter((s) => s.date >= today() && s.status === "planned")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  return (
    <AppContext.Provider
      value={{ db, setDb, toast: setToast, openWorkout, go }}
    >
      <AppMotion>
        {onboard ? (
          <Onboarding />
        ) : (
          <div className="app-shell">
            <aside className={`sidebar ${drawer ? "open" : ""}`}>
              <div className="sidebar-logo">
                <Logo />
                <button
                  className="mobile-only icon-button ghost"
                  aria-label="Close navigation"
                  onClick={() => setDrawer(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="sidebar-tagline">TRAIN WITH INTENT.</div>
              <div className="nav-scroll">
                <div className="nav-label">WORKSPACE</div>
                <nav aria-label="Main navigation">
                  {nav.map((n, i) => (
                    <React.Fragment key={n.path}>
                      {i === 4 && (
                        <div className="nav-label sport-nav-label">
                          THE DISCIPLINES
                        </div>
                      )}
                      {i === 8 && <div className="nav-divider" />}
                      {i === 12 && <div className="nav-divider" />}
                      <NavLink
                        to={n.path}
                        end={n.path === "/"}
                        onClick={() => setDrawer(false)}
                        className={({ isActive }) =>
                          `nav-item ${isActive ? "active" : ""}`
                        }
                      >
                        <n.icon size={17} strokeWidth={1.6} />
                        <span>{n.label}</span>
                        {n.label === "AI Coach" && (
                          <span className="nav-new">DEMO</span>
                        )}
                        {n.sport && (
                          <i
                            className={`sport-dot sport-${n.sport.toLowerCase()}`}
                          />
                        )}
                      </NavLink>
                    </React.Fragment>
                  ))}
                </nav>
              </div>
              <div className="sidebar-bottom">
                <div className="phase-card">
                  <div className="eyebrow">
                    <span className="status-dot" />
                    CURRENT PHASE
                  </div>
                  <strong>
                    {block?.phase === "Base"
                      ? "Base building"
                      : block?.phase || "Base building"}
                    <ArrowUpRight size={15} />
                  </strong>
                  <p>Strong foundations. Long horizons.</p>
                  <div className="phase-progress">
                    <i />
                  </div>
                  <span>
                    WEEK {String(blockWeek).padStart(2, "0")} <span>/ 04</span>
                  </span>
                </div>
                <button
                  className="athlete-profile"
                  onClick={() => go("/settings")}
                >
                  <div className="avatar">
                    {db.athlete.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <strong>{db.athlete.name}</strong>
                    <small>ENDURANCE ATHLETE</small>
                  </div>
                  <ChevronDown size={15} />
                </button>
              </div>
            </aside>
            {drawer && (
              <button
                className="sidebar-backdrop"
                aria-label="Close navigation"
                onClick={() => setDrawer(false)}
              />
            )}
            <div className="main-shell">
              <header className="topbar">
                <div className="topbar-left">
                  <button
                    className="mobile-only icon-button ghost"
                    onClick={() => setDrawer(true)}
                    aria-label="Open navigation"
                  >
                    <Menu size={20} />
                  </button>
                  <div className="mobile-only mobile-brand">
                    <Logo />
                  </div>
                  <span className="topbar-breadcrumb">
                    WORKSPACE <ChevronRight size={12} />{" "}
                    <b>
                      {nav.find((n) => n.path === location.pathname)?.label ||
                        "Overview"}
                    </b>
                  </span>
                  <span className="topbar-date">
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: db.athlete.preferences.timezone,
                    })}
                  </span>
                </div>
                <div className="topbar-actions">
                  <button
                    className="search-trigger"
                    onClick={() => setSearch(true)}
                    aria-label="Search AERON"
                  >
                    <Search size={16} />
                    <span>Search anything</span>
                    <kbd>⌘ K</kbd>
                  </button>
                  <div className="topbar-divider" />
                  <button
                    className="icon-button ghost notification-button"
                    aria-label="Open notifications"
                    onClick={() => setNotifications(true)}
                  >
                    <Bell size={18} />
                    {db.athlete.preferences.notifications && <i />}
                  </button>
                  <Button size="sm" onClick={() => openWorkout("new")}>
                    <Plus size={16} />
                    <span className="quick-add-label">Quick add</span>
                  </Button>
                  <button
                    className="avatar small"
                    onClick={() => go("/settings")}
                    aria-label="Open athlete settings"
                  >
                    {db.athlete.name.slice(0, 1)}
                  </button>
                </div>
              </header>
              <main className="main-content">
                <div className="demo-topline">
                  <span>
                    <i className="status-dot" /> PERSONAL TRAINING / DEMO MODE
                  </span>
                  {!db.onboarded ? (
                    <button onClick={() => go("/onboarding")}>
                      Build your training system <ArrowUpRight size={13} />
                    </button>
                  ) : (
                    <span>LOCAL-FIRST. ALWAYS YOURS.</span>
                  )}
                </div>
                {notice && (
                  <div className="storage-notice" role="alert">
                    {notice}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => storage.original()}
                    >
                      Download original
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotice("")}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
                <ErrorBoundary>
                  <Fade key={location.pathname}>
                    <Suspense
                      fallback={
                        <div className="loading-screen">
                          <Logo />
                          <p>Aligning your training…</p>
                        </div>
                      }
                    >
                      <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/plans" element={<Plans />} />
                        <Route path="/library" element={<WorkoutLibrary />} />
                        <Route
                          path="/running"
                          element={<WorkoutLibrary sport="Running" />}
                        />
                        <Route
                          path="/cycling"
                          element={<WorkoutLibrary sport="Cycling" />}
                        />
                        <Route
                          path="/swimming"
                          element={<WorkoutLibrary sport="Swimming" />}
                        />
                        <Route path="/strength" element={<Strength />} />
                        <Route path="/nutrition" element={<Nutrition />} />
                        <Route path="/recovery" element={<Recovery />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/coach" element={<Coach />} />
                        <Route
                          path="/integrations"
                          element={<Integrations />}
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Overview />} />
                      </Routes>
                    </Suspense>
                  </Fade>
                </ErrorBoundary>
                <footer className="app-footer">
                  <span>
                    AERON <b>®</b> · INTELLIGENCE IN MOTION.
                  </span>
                  <a
                    href="https://github.com/LidlDev/aeron"
                    target="_blank"
                    rel="noreferrer"
                  >
                    V2 · Source & AGPL license ↗
                  </a>
                </footer>
              </main>
            </div>
            <nav className="bottom-nav" aria-label="Mobile navigation">
              {[
                { label: "Home", path: "/", icon: LayoutDashboard },
                { label: "Calendar", path: "/calendar", icon: CalendarDays },
                { label: "Train", path: "/library", icon: Activity },
                {
                  label: "Analyze",
                  path: "/analytics",
                  icon: ChartNoAxesCombined,
                },
                { label: "Coach", path: "/coach", icon: Sparkles },
              ].map((n) => (
                <NavLink
                  key={n.path}
                  to={n.path}
                  end={n.path === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <n.icon size={20} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
        {workout && (
          <Suspense fallback={null}>
            <WorkoutDialog
              key={`${workout.id}-${workout.sessionId}`}
              workoutId={workout.id}
              sessionId={workout.sessionId}
              defaultDate={workout.date}
              onClose={() => setWorkout(null)}
            />
          </Suspense>
        )}
        {search && (
          <Modal
            open
            onClose={() => setSearch(false)}
            title="Find your next move"
            description="Search pages and structured workouts."
          >
            <div className="dialog-body">
              <div className="search-field">
                <Search size={17} />
                <input
                  autoFocus
                  placeholder="Workouts, disciplines, settings…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
              </div>
              <div className="search-results">
                {nav
                  .filter((n) =>
                    n.label.toLowerCase().includes(searchQ.toLowerCase()),
                  )
                  .map((n) => (
                    <button
                      key={n.path}
                      onClick={() => {
                        go(n.path);
                        setSearch(false);
                      }}
                    >
                      <n.icon size={17} />
                      {n.label}
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                {searchQ &&
                  Object.values(db.workouts)
                    .filter((w) =>
                      w.title.toLowerCase().includes(searchQ.toLowerCase()),
                    )
                    .slice(0, 12)
                    .map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSearch(false);
                          openWorkout(w.id);
                        }}
                      >
                        <Activity size={17} />
                        {w.title}
                        <Badge sport={w.sport}>{w.sport}</Badge>
                      </button>
                    ))}
              </div>
            </div>
          </Modal>
        )}
        {notifications && (
          <Modal
            open
            onClose={() => setNotifications(false)}
            title="Your training, in focus"
            description="Local training reminders"
          >
            <div className="dialog-body">
              {db.athlete.preferences.notifications ? (
                <>
                  <p className="muted">
                    Demo environment · These are local reminders from your
                    calendar.
                  </p>
                  {upcoming.map((s) => (
                    <button
                      className="notification-item"
                      key={s.id}
                      onClick={() => {
                        setNotifications(false);
                        openWorkout(s.workoutId, s.id);
                      }}
                    >
                      <CalendarDays size={20} />
                      <div>
                        <h3>{db.workouts[s.workoutId].title}</h3>
                        <p>
                          {dateLabel(s.date)} ·{" "}
                          {Math.round(duration(db.workouts[s.workoutId]))}{" "}
                          minutes
                        </p>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                  <button
                    className="notification-item"
                    onClick={() => {
                      go("/recovery");
                      setNotifications(false);
                    }}
                  >
                    <Heart size={20} />
                    <div>
                      <h3>Take a moment to check in.</h3>
                      <p>Your recovery is part of the plan.</p>
                    </div>
                  </button>
                </>
              ) : (
                <p>
                  In-app reminders are disabled. Enable them in Settings →
                  Notifications.
                </p>
              )}
            </div>
          </Modal>
        )}
        {toastMessage && (
          <div className="toast" role="status">
            <div>
              <Check size={16} />
            </div>
            <span>{toastMessage}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </AppMotion>
    </AppContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
