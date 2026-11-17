// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const R = require("../js/rewrite.js");
const A = require("../js/analyzer.js");
const KB = require("../js/knowledge.js");

const draft = "Hey guys welcome back. Honey is old. And then it lasts forever.";

test("prompt carries draft, style rules, structure and diagnosis", () => {
  const p = R.buildPrompt({ text: draft, topic: "Honey", minutes: 5, wpm: 150, styleId: "detective", templateId: "auto", analysis: A.analyze(draft) });
  assert.ok(p.includes("<draft>\n" + draft));
  assert.ok(p.includes("Detective Documentary"));
  assert.ok(p.includes("The Central Question")); // detective template is the style's default
  assert.ok(p.includes("<diagnosis>"));
  assert.ok(p.includes("about 750 spoken words"));
  assert.ok(p.includes("=== SCRIPT ==="));
});

test("explicit template overrides the style default", () => {
  const p = R.buildPrompt({ text: draft, minutes: 3, wpm: 150, styleId: "detective", templateId: "tutorial" });
  assert.ok(p.includes("Teaching Tutorial"));
  assert.ok(!p.includes("<diagnosis>"));
});

test("every style points at a real template", () => {
  for (const s of KB.STYLES) assert.ok(KB.TEMPLATES.some((t) => t.id === s.template), s.id);
});

test("parses a complete answer", () => {
  const out = "=== TITLES ===\n1. First\n2) Second\n=== THUMBNAIL ===\nA jar\n=== SCRIPT ===\n## Cold Open\nLine one. [shot]\n\nLine two.\n\n## Ending\nBye.\n=== CHANGES ===\n- Cut the greeting\n* Added a question";
  const r = R.parse(out);
  assert.deepEqual(r.titles, ["First", "Second"]);
  assert.equal(r.thumbnail, "A jar");
  assert.equal(r.sections.length, 2);
  assert.equal(r.sections[0].title, "Cold Open");
  assert.equal(r.sections[0].text, "Line one. [shot]\n\nLine two.");
  assert.deepEqual(r.changes, ["Cut the greeting", "Added a question"]);
});

test("parses partial (streaming) answers without throwing", () => {
  assert.deepEqual(R.parse("").sections, []);
  assert.deepEqual(R.parse("=== TITLES ===\n1. A").titles, ["A"]);
  const mid = R.parse("=== TITLES ===\n1. A\n=== THUMBNAIL ===\nX\n=== SCRIPT ===\n## Hook\nHalf a sent");
  assert.equal(mid.sections.length, 1);
  assert.equal(mid.sections[0].text, "Half a sent");
});

test("plain script without markers becomes one section", () => {
  const r = R.parse("Just a script.\nWith two lines.");
  assert.equal(r.sections.length, 1);
  assert.equal(r.sections[0].title, "Script");
});
