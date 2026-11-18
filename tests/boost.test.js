// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const B = require("../js/boost.js");
const A = require("../js/analyzer.js");

const secs = [
  { title: "Open", text: "Hello everyone, my name is Sam. Today we look at honey. [Jar on table] It lasts a long time." },
  { title: "Body", text: "Honey is dry.\n\nAnd then bacteria die. That is basically it." },
];

test("breakdown explains every lost point", () => {
  const r = A.analyze(secs);
  for (const b of B.breakdown(r)) {
    const lost = b.items.reduce((a, i) => a + i.points, 0);
    assert.ok(Math.abs(100 - lost - b.score) < 0.6 || b.score === 0, `${b.key}: ${b.score} vs lost ${lost}`);
  }
});

test("applyEdits replaces, inserts and deletes by sentence", () => {
  const edits = [
    { section: 0, sentence: 1, action: "replace", text: "Three thousand years later, the honey was still edible." },
    { section: 0, sentence: 2, action: "insert_after", text: "Why?" },
    { section: 1, sentence: 3, action: "delete", text: "" },
    { section: 1, sentence: 0, action: "insert_after", text: "Here's the trick." },
  ];
  const r = B.applyEdits(secs, edits);
  assert.equal(r.sections[0].text, "Three thousand years later, the honey was still edible. Today we look at honey. Why? [Jar on table] It lasts a long time.");
  assert.equal(r.sections[1].text, "Here's the trick. Honey is dry.\n\nAnd then bacteria die.");
  assert.equal(r.marks.length, 3);
  for (const m of r.marks) assert.ok(["Three thousand years later, the honey was still edible.", "Why?", "Here's the trick."].includes(r.sections[m.section].text.slice(m.start, m.end)));
});

test("deleting a sentence mid-paragraph leaves clean spacing", () => {
  const r = B.applyEdits([{ title: "A", text: "One. Two. Three." }], [{ section: 0, sentence: 2, action: "delete" }]);
  assert.equal(r.sections[0].text, "One. Three.");
  const r2 = B.applyEdits([{ title: "A", text: "One. Two." }], [{ section: 0, sentence: 2, action: "delete" }]);
  assert.equal(r2.sections[0].text, "One.");
});

test("normalise rejects out-of-range or empty edits and keeps the original", () => {
  const n = B.normalise({ edits: [
    { area: "hook", section: 1, sentence: 1, action: "replace", text: "New open." },
    { area: "hook", section: 1, sentence: 9, action: "replace", text: "x" },
    { area: "x", section: 3, sentence: 1, action: "replace", text: "x" },
    { area: "clarity", section: 2, sentence: 3, action: "delete" },
    { area: "clarity", section: 2, sentence: 1, action: "rewrite", text: "x" },
    { area: "engagement", section: 2, sentence: 0, action: "insert_after", text: "Imagine you found a jar." },
    { area: "hook", section: 1, sentence: 2, action: "replace", text: "" },
  ] }, secs);
  assert.equal(n.length, 3);
  assert.equal(n[0].original, "Hello everyone, my name is Sam.");
  assert.equal(n[1].action, "delete");
  assert.equal(n[2].area, "engagement");
});

test("impact reports the real score change", () => {
  const imp = B.impact(secs, [{ section: 0, sentence: 1, action: "replace", text: "In 1922, archaeologists opened a tomb and found honey that could still be eaten. Could you eat it?" }]);
  assert.ok(imp.delta.hook > 0, JSON.stringify(imp));
});

test("prompt lists the deductions for the chosen areas only", () => {
  const r = A.analyze(secs);
  const p = B.buildPrompt({ sections: secs, result: r, areas: ["hook"], wpm: 150, niche: { id: "spy" } });
  assert.ok(p.includes("Hook: "));
  assert.ok(p.includes("Preamble in the first 30 seconds"));
  assert.ok(!p.includes("Clarity: "));
  assert.ok(p.includes("S1.1 | Hello everyone, my name is Sam."));
  assert.ok(!p.includes("</script"));
});
