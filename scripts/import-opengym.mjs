/** Text-only import. Dataset license inspected at pinned revision; see docs/OPENGYM_INTEGRATION.md. */
import fs from "node:fs";
const source = process.argv[2] || "/workspace/opengym-reference";
const raw = fs
  .readFileSync(source + "/frontend/src/lib/exercises-data.js", "utf8")
  .replace(/^export const EXDB\s*=\s*/, "")
  .trim()
  .replace(/;$/, "");
const rows = JSON.parse(raw);
const existing = {
  "ex-1": "0042",
  "ex-2": "1760",
  "ex-3": "0085",
  "ex-4": "0811",
  "ex-7": "0431",
  "ex-9": "1757",
  "ex-10": "0417",
  "ex-11": "1379",
  "ex-12": "0025",
  "ex-14": "0293",
  "ex-16": "2330",
  "ex-17": "0426",
  "ex-18": "0979",
  "ex-19": "0276",
  "ex-21": "2133",
  "ex-23": "3013",
};
const aliases = Object.fromEntries(
  Object.entries(existing).map(([a, o]) => [o, a]),
);
function category(n) {
  if (/calf|ankle|tibialis/.test(n)) return "Calf and ankle";
  if (/squat/.test(n)) return "Squat";
  if (/deadlift|good morning|hip thrust|glute bridge/.test(n)) return "Hinge";
  if (/lunge|step-up|split squat/.test(n)) return "Lunge";
  if (/stretch|rotation|mobility/.test(n)) return "Mobility";
  if (
    /crunch|sit-up|plank|pallof|dead bug|twist|ab |heel touch|carry|farmers/.test(
      n,
    )
  )
    return "Core";
  if (/press|push-up|dip|fly/.test(n)) return "Push";
  if (/row|pull|chin-up/.test(n)) return "Pull";
  if (/hip|adduct|abduct/.test(n)) return "Hip stability";
  return "Accessory";
}
const catalogue = new Map(),
  idMap = {};
for (const e of rows) {
  const key = e.n.toLowerCase().replace(/[^a-z0-9]/g, "") + "|" + e.eq;
  const cat = category(e.n);
  let record = catalogue.get(key);
  if (record) {
    record.upstreamIds.push(e.id);
    idMap[e.id] = record.id;
    continue;
  }
  const id = aliases[e.id] || "og:" + e.id;
  record = {
    id,
    name: e.n.replace(/^./, (s) => s.toUpperCase()),
    category: cat,
    muscles: [...new Set([e.tg, ...e.sm].filter(Boolean))],
    equipment: e.eq,
    difficulty: "Not specified",
    technique: e.st,
    guidance:
      "Begin with controlled sets, an appropriate range of motion, and a load you can repeat with good form.",
    mistakes:
      "Rushing the lowering phase, using momentum, or continuing after technique changes.",
    cues: e.st[1] || e.st[0] || "Move with control.",
    substitutions: [],
    unilateral: /single|one arm|one leg|alternate|alternating/.test(e.n),
    compound:
      ["Squat", "Hinge", "Lunge", "Push", "Pull"].includes(cat) &&
      !/curl|extension|fly|raise/.test(e.n),
    upstreamIds: [e.id],
    origin: "OpenGym catalogue",
    classification: "Inferred from exercise name; not supplied by upstream",
    source:
      "https://github.com/alexpcosta/opengym/blob/678bf5bf10446e8997a77d43e89c9b2721d8d0fc/frontend/src/lib/exercises-data.js",
  };
  catalogue.set(key, record);
  idMap[e.id] = id;
}
const records = [...catalogue.values()];
for (const e of records)
  e.substitutions = records
    .filter(
      (c) =>
        c.id !== e.id &&
        c.category === e.category &&
        c.equipment === e.equipment,
    )
    .slice(0, 3)
    .map((c) => c.name);
fs.writeFileSync("src/data/opengym-catalogue.json", JSON.stringify(records));
fs.writeFileSync(
  "src/data/opengym-id-map.json",
  JSON.stringify(idMap, null, 2),
);
fs.writeFileSync(
  "src/data/opengym-provenance.json",
  JSON.stringify(
    {
      upstreamCommit: "678bf5bf10446e8997a77d43e89c9b2721d8d0fc",
      datasetCommit: "7455efae41b330c265e7cd4b78dfa848e7ce5ebd",
      sourceRecords: rows.length,
      importedRecords: records.length,
      deduplicated: rows.length - records.length,
      existingAliases: existing,
      mediaImported: 0,
      license: "MIT (data text); AGPL-3.0-or-later (adapted application code)",
    },
    null,
    2,
  ),
);
console.log({
  source: rows.length,
  imported: records.length,
  duplicates: rows.length - records.length,
});
