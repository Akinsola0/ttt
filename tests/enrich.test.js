// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const E = require("../js/enrich.js");

const slice = (t, us) => us.map((u) => t.slice(u.start, u.end));

test("segment splits sentences without touching brackets or quotes", () => {
  const t = "June 1957. [pause] The FBI knocks. [Wide shot: door. Rain.] He said, “No.” Then silence…\n\nNew paragraph";
  assert.deepEqual(slice(t, E.segment(t)), [
    "June 1957.",
    "[pause] The FBI knocks.",
    "[Wide shot: door. Rain.] He said, “No.”",
    "Then silence…",
    "New paragraph",
  ]);
});

const sections = [
  { title: "Cold Open", text: "June 1957. Brooklyn.\n\nThe FBI is at the door." },
  { title: "The Game", text: "He used a dead drop. Nobody noticed." },
];

test("apply inserts sentences and keeps every original character", () => {
  const placements = [
    { section: 1, after: 1, text: "A dead drop is a hidden spot where spies leave messages.", addition: 1, reason: "define term" },
    { section: 0, after: 0, text: "This is a true story.", addition: 2, reason: "" },
    { section: 0, after: 3, text: "They had a warrant.", addition: 3, reason: "" },
  ];
  const r = E.apply(sections, placements);
  assert.equal(r.sections[1].text, "He used a dead drop. A dead drop is a hidden spot where spies leave messages. Nobody noticed.");
  assert.equal(r.sections[0].text, "This is a true story. June 1957. Brooklyn.\n\nThe FBI is at the door. They had a warrant.");
  assert.equal(r.inserts.length, 3);
  for (const x of r.inserts) assert.equal(r.sections[x.section].text.slice(x.start, x.end), placements.find((p) => p.addition === x.addition).text);
  assert.ok(E.verify(sections, r.sections, r.inserts));
});

test("verify catches any change to the original", () => {
  const r = E.apply(sections, [{ section: 0, after: 1, text: "Hot night.", addition: 1 }]);
  const tampered = r.sections.map((s) => ({ ...s }));
  tampered[0].text = tampered[0].text.replace("Brooklyn", "Queens");
  assert.equal(E.verify(sections, tampered, r.inserts), false);
});

test("several inserts at the same point and in an empty section", () => {
  const secs = [{ title: "A", text: "One. Two." }, { title: "B", text: "" }];
  const r = E.apply(secs, [
    { section: 0, after: 1, text: "X.", addition: 1 },
    { section: 0, after: 1, text: "Y.", addition: 2 },
    { section: 1, after: 0, text: "Z.", addition: 3 },
    { section: 1, after: 2, text: "W.", addition: 4 },
  ]);
  assert.equal(r.sections[0].text, "One. X. Y. Two.");
  assert.equal(r.sections[1].text, "Z. W.");
  assert.ok(E.verify(secs, r.sections, r.inserts));
});

test("normalise drops bad placements and clamps positions", () => {
  const n = E.normalise({
    placements: [
      { addition: 1, section: 2, after: 99, text: " Late. " },
      { addition: 2, section: 9, after: 1, text: "Nowhere." },
      { addition: 3, section: 1, after: -1, text: "Bad." },
      { addition: 4, section: 1, after: 1, text: "" },
    ],
    skipped: [{ addition: 5, reason: "contradicts" }],
    sources: ["Check the date", ""],
  }, sections, 5);
  assert.equal(n.placements.length, 1);
  assert.equal(n.placements[0].after, 2);
  assert.equal(n.placements[0].text, "Late.");
  assert.equal(n.dropped, 3);
  assert.deepEqual(n.skipped, [{ addition: 5, reason: "contradicts" }]);
  assert.deepEqual(n.sources, ["Check the date"]);
  assert.deepEqual(E.normalise(null, sections, 1).placements, []);
});

test("prompt numbers sentences and lists additions with sources", () => {
  const p = E.buildPrompt({ sections, additions: [{ kind: "term", text: "dead drop" }, { kind: "fact", text: "Abel was arrested on 21 June 1957", source: "FBI Vault" }], niche: { id: "spy", name: "Spy" } });
  assert.ok(p.includes("S1.1 | June 1957."));
  assert.ok(p.includes("S2.2 | Nobody noticed."));
  assert.ok(p.includes("A1 [Term to define]: dead drop"));
  assert.ok(p.includes("Source given by the writer: FBI Vault"));
  assert.ok(p.includes("no 'I'"));
});
