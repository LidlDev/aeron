import { useState, lazy, Suspense } from "react";
import {
  Plus,
  Check,
  Save,
  Trash2,
  Droplets,
  Heart,
  Activity,
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
  type FuelItem,
  type RecoveryCheckin,
  uid,
  today,
  hours,
} from "./domain";
const TrendChart = lazy(() =>
  import("./Charts").then((m) => ({ default: m.TrendChart })),
);
const defaultFoods: Omit<FuelItem, "id" | "quantity">[] = [
  { name: "Energy gel", carbs: 25, fluid: 0, sodium: 50, calories: 100 },
  { name: "Sports drink", carbs: 30, fluid: 500, sodium: 300, calories: 120 },
  { name: "Energy bar", carbs: 40, fluid: 0, sodium: 120, calories: 200 },
  { name: "Banana", carbs: 27, fluid: 0, sodium: 1, calories: 105 },
  { name: "Electrolyte drink", carbs: 0, fluid: 500, sodium: 400, calories: 0 },
  { name: "Custom food", carbs: 0, fluid: 0, sodium: 0, calories: 0 },
];
export function Nutrition() {
  const { db, setDb, toast } = useApp();
  const [durationM, setDuration] = useState(120);
  const [sport, setSport] = useState("Cycling");
  const [temperature, setTemp] = useState(20);
  const [intensity, setIntensity] = useState("Moderate");
  const [tolerance, setTolerance] = useState(60);
  const [items, setItems] = useState<FuelItem[]>([
    { ...defaultFoods[0], id: uid(), quantity: 3 },
    { ...defaultFoods[1], id: uid(), quantity: 2 },
  ]);
  const [name, setName] = useState("Weekend endurance fuel");
  const [sessionId, setSessionId] = useState("");
  const [meal, setMeal] = useState("");
  const [mealType, setMealType] = useState("Meal");
  const [fluid, setFluid] = useState(0);
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState("Fueling planner");
  const lower = durationM < 60 ? 0 : durationM < 150 ? 30 : 60;
  const upper = Math.min(
    tolerance,
    durationM < 60 ? 30 : durationM < 150 ? 60 : 90,
  );
  const totals = items.reduce(
    (n, i) => ({
      carbs: n.carbs + i.carbs * i.quantity,
      fluid: n.fluid + i.fluid * i.quantity,
      sodium: n.sodium + i.sodium * i.quantity,
      calories: n.calories + i.calories * i.quantity,
    }),
    { carbs: 0, fluid: 0, sodium: 0, calories: 0 },
  );
  function save() {
    if (
      !name.trim() ||
      durationM < 15 ||
      items.some(
        (i) => i.carbs < 0 || i.fluid < 0 || i.sodium < 0 || i.quantity < 0,
      )
    ) {
      toast("Check your plan name, duration, and product values.");
      return;
    }
    const id = uid();
    setDb((d) => ({
      ...d,
      fueling: {
        ...d.fueling,
        [id]: {
          id,
          name,
          sessionId,
          sport,
          duration: durationM,
          temperature,
          intensity,
          tolerance,
          items,
        },
      },
    }));
    toast(
      "Fueling plan saved" + (sessionId ? " and linked to your workout." : "."),
    );
  }
  return (
    <>
      <PageTitle
        eyebrow="FUEL THE WORK"
        title="Fueling & nutrition"
        description="Prepare well. Fuel consistently. Recover deliberately."
      />
      <div className="stats-grid">
        <Stat
          label="PRE-SESSION"
          value="Prepare"
          sub="Familiar carbohydrate-rich foods"
        />
        <Stat
          label="DURING"
          value={`${Math.max(0, Math.min(lower, upper))}–${upper}`}
          unit="g/h"
          sub="Illustrative carbohydrate range"
          accent
        />
        <Stat
          label="POST-SESSION"
          value="Recover"
          sub="A meal with carbs and protein"
        />
        <Stat
          label="HYDRATION TODAY"
          value={Object.values(db.nutrition)
            .filter((n) => n.date === today())
            .reduce((n, v) => n + v.fluid, 0)}
          unit="ml"
          sub="Journal entries only"
        />
      </div>
      <div className="segmented page-tabs">
        {["Fueling planner", "Journal", "Saved plans"].map((s) => (
          <button
            key={s}
            className={tab === s ? "active" : ""}
            onClick={() => setTab(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {tab === "Fueling planner" && (
        <div className="two-col">
          <Card>
            <SectionTitle title="Your session. Your fuel." />
            <div className="form-grid">
              <Field label="Sport">
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option>Cycling</option>
                  <option>Running</option>
                  <option>Swimming</option>
                </select>
              </Field>
              <Field label="Session duration (minutes)">
                <input
                  type="number"
                  min="15"
                  max="900"
                  value={durationM}
                  onChange={(e) => setDuration(Math.max(15, +e.target.value))}
                />
              </Field>
              <Field label="Intensity">
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                >
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Hard</option>
                </select>
              </Field>
              <Field label="Temperature (°C)">
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemp(+e.target.value)}
                />
              </Field>
              <Field label="Known carbohydrate tolerance (g/h)">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={tolerance}
                  onChange={(e) =>
                    setTolerance(Math.max(0, Math.min(120, +e.target.value)))
                  }
                />
              </Field>
            </div>
            <div className="fuel-guidance">
              <span className="eyebrow">ILLUSTRATIVE SESSION GUIDANCE</span>
              <h2>
                {Math.max(0, Math.min(lower, upper))}–{upper}
                <small> g carbohydrate / hour</small>
              </h2>
              <p>
                For {hours(durationM)}: approximately{" "}
                {Math.round((Math.min(lower, upper) * durationM) / 60)}–
                {Math.round((upper * durationM) / 60)}g in total. Start with
                amounts you have already tolerated in training.
              </p>
              <p>
                <Droplets size={16} /> An educational fluid range is 400–800
                ml/h; individual needs vary with sweat rate, weather, pace, and
                access.{" "}
                {temperature >= 25
                  ? "Warm conditions: plan more opportunities to drink and adjust using your experience."
                  : "Use thirst and your known sweat patterns to guide adjustments."}
              </p>
              <p>
                Electrolytes: choose a concentration you tolerate and consider
                sweat losses and session duration. Product sodium totals are
                shown in the planner.
              </p>
            </div>
            <h3>Suggested timing</h3>
            <div className="fuel-schedule">
              {Array.from(
                { length: Math.min(12, Math.floor(durationM / 30)) },
                (_, i) => (
                  <div key={i}>
                    <span className="mono">{(i + 1) * 30} MIN</span>
                    <p>
                      Small, regular intake
                      {upper ? ` · up to ${Math.round(upper / 2)}g carbs` : ""}.
                      Drink as needed.
                    </p>
                  </div>
                ),
              )}
            </div>
            <p className="helper">
              Educational training estimates, not a medically personalized
              prescription. Increase intake gradually within known tolerance.
              The calculator sets no calorie or weight-loss target.
            </p>
          </Card>
          <Card>
            <SectionTitle title="Build your fueling plan" />
            <Field label="Plan name">
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Attach to a workout">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">Save without linking</option>
                {Object.values(db.sessions)
                  .filter((s) => s.status === "planned" && s.date >= today())
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} · {db.workouts[s.workoutId].title}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="fuel-items">
              {items.map((item) => (
                <div className="fuel-item" key={item.id}>
                  <div className="button-row spread">
                    <input
                      aria-label="Product name"
                      value={item.name}
                      onChange={(e) =>
                        setItems((a) =>
                          a.map((i) =>
                            i.id === item.id
                              ? { ...i, name: e.target.value }
                              : i,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove food"
                      onClick={() =>
                        setItems((a) => a.filter((i) => i.id !== item.id))
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="food-values">
                    {(
                      [
                        "quantity",
                        "carbs",
                        "fluid",
                        "sodium",
                        "calories",
                      ] as const
                    ).map((k) => (
                      <Field
                        key={k}
                        label={
                          k === "quantity"
                            ? "Qty"
                            : k === "carbs"
                              ? "Carbs g"
                              : k === "fluid"
                                ? "Fluid ml"
                                : k === "sodium"
                                  ? "Sodium mg"
                                  : "kcal"
                        }
                      >
                        <input
                          type="number"
                          min="0"
                          value={item[k]}
                          onChange={(e) =>
                            setItems((a) =>
                              a.map((i) =>
                                i.id === item.id
                                  ? { ...i, [k]: Math.max(0, +e.target.value) }
                                  : i,
                              ),
                            )
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Field label="Add a product">
              <select
                value=""
                onChange={(e) => {
                  const food = defaultFoods.find(
                    (f) => f.name === e.target.value,
                  );
                  if (food)
                    setItems((a) => [
                      ...a,
                      { ...food, id: uid(), quantity: 1 },
                    ]);
                }}
              >
                <option value="">Choose fuel…</option>
                {defaultFoods.map((f) => (
                  <option key={f.name}>{f.name}</option>
                ))}
              </select>
            </Field>
            <div className="fuel-totals">
              <div>
                <strong>{totals.carbs}g</strong>
                <span>CARBS</span>
              </div>
              <div>
                <strong>{totals.fluid}ml</strong>
                <span>FLUID</span>
              </div>
              <div>
                <strong>{totals.sodium}mg</strong>
                <span>SODIUM</span>
              </div>
              <div>
                <strong>{totals.calories}</strong>
                <span>KCAL</span>
              </div>
            </div>
            <Button onClick={save}>
              <Save size={16} />
              Save fueling plan
            </Button>
          </Card>
        </div>
      )}
      {tab === "Journal" && (
        <div className="two-col">
          <Card>
            <SectionTitle title="A simple nutrition journal" />
            <Field label="Entry type">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                {["Meal", "Snack", "Hydration", "Training fuel"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Food / drink">
              <input
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
                placeholder="Oats, banana, coffee…"
              />
            </Field>
            <Field label="Fluid (ml, optional)">
              <input
                type="number"
                min="0"
                value={fluid}
                onChange={(e) => setFluid(Math.max(0, +e.target.value))}
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <Button
              disabled={!meal.trim()}
              onClick={() => {
                const id = uid();
                setDb((d) => ({
                  ...d,
                  nutrition: {
                    ...d.nutrition,
                    [id]: {
                      id,
                      date: today(),
                      type: mealType,
                      name: meal,
                      fluid,
                      notes,
                    },
                  },
                }));
                setMeal("");
                setNotes("");
                setFluid(0);
                toast("Journal entry saved.");
              }}
            >
              <Plus size={16} />
              Log entry
            </Button>
          </Card>
          <Card>
            <SectionTitle title="Recent entries" />
            {Object.values(db.nutrition).length ? (
              Object.values(db.nutrition)
                .reverse()
                .map((n) => (
                  <div className="journal-row" key={n.id}>
                    <Badge>{n.type}</Badge>
                    <h3>{n.name}</h3>
                    <p>
                      {n.date} · {n.fluid}ml
                    </p>
                    <p>{n.notes}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDb((d) => {
                          const nutrition = { ...d.nutrition };
                          delete nutrition[n.id];
                          return { ...d, nutrition };
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))
            ) : (
              <Empty
                title="Your journal is ready"
                description="Log meals, hydration, and training fuel at your own pace."
              />
            )}
          </Card>
        </div>
      )}
      {tab === "Saved plans" && (
        <div className="library-grid">
          {Object.values(db.fueling).map((f) => (
            <Card key={f.id}>
              <Badge>
                {f.sport} · {f.duration} MIN
              </Badge>
              <h3>{f.name}</h3>
              <p>
                {f.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
              </p>
              <p className="helper">
                {f.sessionId && db.sessions[f.sessionId]
                  ? `Linked to ${db.workouts[db.sessions[f.sessionId].workoutId].title}`
                  : "Unlinked plan"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(f.name);
                  setSessionId(f.sessionId);
                  setItems(f.items);
                  setDuration(f.duration);
                  setSport(f.sport);
                  setTemp(f.temperature);
                  setTolerance(f.tolerance);
                  setTab("Fueling planner");
                }}
              >
                Edit a copy
              </Button>
            </Card>
          ))}
          {!Object.keys(db.fueling).length && (
            <Empty
              title="Fuel your next long session"
              description="Create a plan and link it to your training calendar."
              action={
                <Button onClick={() => setTab("Fueling planner")}>
                  Build a plan
                </Button>
              }
            />
          )}
        </div>
      )}
    </>
  );
}
export function Recovery() {
  const { db, setDb, toast } = useApp();
  const [form, setForm] = useState<RecoveryCheckin>(
    () =>
      db.recovery[today()] || {
        id: today(),
        date: today(),
        sleep: 7.5,
        quality: 3,
        fatigue: 2,
        soreness: 2,
        motivation: 3,
        stress: 2,
        readiness: 3,
        notes: "",
      },
  );
  const history = Object.values(db.recovery)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
  return (
    <>
      <PageTitle
        eyebrow="ADAPTATION HAPPENS HERE"
        title="Recovery check-in"
        description="Listen to your body. Give tomorrow’s training a stronger start."
      />
      <div className="recovery-hero card">
        <div>
          <Badge>SUBJECTIVE WELLNESS · NOT A MEDICAL SCORE</Badge>
          <h2>
            CHECK IN.
            <br />
            <span>COME BACK STRONGER.</span>
          </h2>
          <p>
            {form.fatigue >= 4
              ? "Your fatigue is elevated. Make space for recovery and an easier next session."
              : "A few moments of reflection. A more informed training day."}
          </p>
        </div>
        <AeronScene variant="recovery" value={form.readiness} />
      </div>
      <div className="two-col">
        <Card>
          <SectionTitle
            title="How are you arriving today?"
            meta={dateLabel()}
          />
          <Field label="Sleep duration (hours)">
            <input
              type="number"
              min="0"
              max="24"
              step=".25"
              value={form.sleep}
              onChange={(e) =>
                setForm({
                  ...form,
                  sleep: Math.min(24, Math.max(0, +e.target.value)),
                })
              }
            />
          </Field>
          {(
            [
              "quality",
              "fatigue",
              "soreness",
              "motivation",
              "stress",
              "readiness",
            ] as const
          ).map((k) => (
            <div className="scale-field" key={k}>
              <label>
                {k === "quality"
                  ? "Sleep quality"
                  : k === "readiness"
                    ? "General readiness"
                    : k === "soreness"
                      ? "Muscle soreness"
                      : k[0].toUpperCase() + k.slice(1)}
              </label>
              <div className="scale-buttons" role="group" aria-label={k}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    aria-label={`${k} ${v} out of 5`}
                    aria-pressed={form[k] === v}
                    className={form[k] === v ? "selected" : ""}
                    onClick={() => setForm({ ...form, [k]: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <small>
                1 ·{" "}
                {["fatigue", "stress", "soreness"].includes(k) ? "Low" : "Poor"}
                <span>
                  5 ·{" "}
                  {["fatigue", "stress", "soreness"].includes(k)
                    ? "High"
                    : "Excellent"}
                </span>
              </small>
            </div>
          ))}
          <Field label="Anything else? (optional)">
            <textarea
              value={form.notes}
              placeholder="How does your body feel?"
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <Button
            onClick={() => {
              setDb((d) => ({
                ...d,
                recovery: { ...d.recovery, [form.date]: form },
              }));
              toast("Check-in saved. Your coach now has today’s context.");
            }}
          >
            <Check size={16} />
            Save daily check-in
          </Button>
        </Card>
        <div>
          <Card>
            <SectionTitle title="Your seven-day rhythm" />
            <Suspense fallback={<p>Loading recovery trends…</p>}>
              <TrendChart
                data={history.map((h) => ({
                  date: h.date.slice(5),
                  Readiness: h.readiness,
                  Fatigue: h.fatigue,
                }))}
                keys={["Readiness", "Fatigue"]}
                color="#72D9AF"
                unit="/5"
              />
            </Suspense>
            <div className="history-checkins">
              {history.map((h) => (
                <div key={h.id}>
                  <span>{dateLabel(h.date)}</span>
                  <span>{h.sleep}h sleep</span>
                  <strong className="mint">{h.readiness}/5</strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="recovery-actions">
            <SectionTitle title="Make room to recover" />
            <p>
              <Heart size={17} />
              Keep easy days easy. A short walk can support your routine.
            </p>
            <p>
              <Droplets size={17} />
              Eat familiar meals, hydrate normally, and prioritize sleep.
            </p>
            <p>
              <Activity size={17} />
              {form.fatigue >= 4
                ? "Elevated fatigue today: ask the Demo Coach to review your next session."
                : "Let your check-ins guide the conversation with your coach."}
            </p>
            <p className="helper">
              Recent rest days:{" "}
              {Object.values(db.sessions).some((s) => s.date === today())
                ? "Today has scheduled training."
                : "Today is clear."}{" "}
              Check-ins reflect how you feel; they are not a clinical recovery
              assessment.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
