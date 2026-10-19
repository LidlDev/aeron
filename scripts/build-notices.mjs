import fs from "node:fs";
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const sections = [
  "AERON V2 — Third-party notices\nApplication source: https://github.com/LidlDev/aeron\nApplication license: AGPL-3.0-or-later; see license.txt\n",
];
for (const [path, p] of Object.entries(lock.packages)) {
  if (!path || !fs.existsSync(path)) continue;
  const names = fs
    .readdirSync(path)
    .filter((n) => /^(licen[sc]e|notice)(\.|$)/i.test(n));
  const notices = names
    .filter((n) => fs.statSync(path + "/" + n).isFile())
    .map((n) => fs.readFileSync(path + "/" + n, "utf8"))
    .join("\n");
  if (notices)
    sections.push(
      `\n--- ${path} @ ${p.version} (${p.license || "See included license"}) ---\n${notices}`,
    );
}
for (const file of [
  "vendor/opengym/PROVENANCE.md",
  "vendor/opengym/EXERCISE_DATA_LICENSE.txt",
  "src/assets/fonts/LICENSE-inter.txt",
  "src/assets/fonts/LICENSE-spacegrotesk.txt",
  "src/assets/fonts/LICENSE-ibmplexmono.txt",
])
  sections.push(`\n--- ${file} ---\n${fs.readFileSync(file, "utf8")}`);
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/third-party-notices.txt", sections.join("\n"));
fs.copyFileSync("LICENSE", "public/license.txt");
console.log("Third-party notices and AGPL license prepared.");
