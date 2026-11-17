// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const KB = require("../js/niches.js");
const R = require("../js/rewrite.js");

test("every niche points at a real style and template, and its checks compile", () => {
  assert.ok(KB.NICHES.length >= 8);
  for (const n of KB.NICHES) {
    assert.ok(KB.STYLES.some((s) => s.id === n.style), n.id + " style");
    assert.ok(KB.TEMPLATES.some((t) => t.id === n.template), n.id + " template");
    for (const c of n.checks) assert.doesNotThrow(() => new RegExp(c.pattern, "i"), n.id + ": " + c.label);
  }
});

test("spy thriller template percentages add up to 100", () => {
  const t = KB.TEMPLATES.find((x) => x.id === "oddity-file");
  assert.equal(t.sections.reduce((a, s) => a + s.pct, 0), 100);
  assert.equal(t.sections[0].title, "Cold Open");
  assert.equal(t.sections[t.sections.length - 1].title, "The File Closes");
});

const spy = KB.NICHES.find((n) => n.id === "spy");

test("spy checks fail a weak first-person draft", () => {
  const weak = "Hey guys, welcome back. Today I want to tell you about a spy. And then he got caught. Don't forget to subscribe!";
  const res = KB.runNicheChecks(spy, weak);
  assert.ok(res.filter((r) => !r.pass).length >= 4);
  assert.equal(res.find((r) => r.label.startsWith("Narrator")).pass, false);
});

test("spy checks pass a well-formed draft, and quoted 'I' is allowed", () => {
  const good = "June 1957. [pause] The man in Room 839 had 11 days left. According to the declassified file, he kept a hollow nickel. [ODDITY] He told agents, “I have nothing to say.”";
  const res = KB.runNicheChecks(spy, good);
  assert.deepEqual(res.filter((r) => !r.pass).map((r) => r.label), []);
});

test("rewrite prompt includes the niche block and asks for sources", () => {
  const p = R.buildPrompt({ text: "draft", minutes: 8, wpm: 140, styleId: "spy-thriller", templateId: "auto", nicheId: "spy" });
  assert.ok(p.includes("<niche>"));
  assert.ok(p.includes("Spy, Classified & Declassified Stories"));
  assert.ok(p.includes("The File Closes"));
  assert.ok(p.includes("=== SOURCES TO CHECK ==="));
  const g = R.buildPrompt({ text: "draft", minutes: 8, wpm: 140, styleId: "auto", templateId: "auto", nicheId: "general" });
  assert.ok(!g.includes("<niche>"));
});

test("parser reads the sources section separately from changes", () => {
  const r = R.parse("=== SCRIPT ===\n## A\nText\n=== CHANGES ===\n- c1\n=== SOURCES TO CHECK ===\n- s1\n- s2");
  assert.deepEqual(r.changes, ["c1"]);
  assert.deepEqual(r.sources, ["s1", "s2"]);
});
