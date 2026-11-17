// Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const A = require("../js/analyzer.js");

test("empty script", () => {
  const r = A.analyze("");
  assert.equal(r.empty, true);
  assert.equal(r.totalWords, 0);
});

test("visual notes in [brackets] are not counted", () => {
  const r = A.analyze("One two three. [B-roll of a very long shot of many things] Four five.");
  assert.equal(r.totalWords, 5);
});

test("runtime follows words per minute", () => {
  const text = Array(150).fill("word").join(" ") + ".";
  assert.equal(Math.round(A.analyze(text, { wpm: 150 }).runtime), 60);
  assert.equal(Math.round(A.analyze(text, { wpm: 100 }).runtime), 90);
});

test("flags preamble in the intro", () => {
  const r = A.analyze("Hey guys, welcome back to the channel. In this video we talk about planes. Don't forget to subscribe.");
  assert.ok(r.issues.some((i) => i.title.startsWith("Preamble")));
  assert.ok(r.scores.hook < 70);
});

test("strong hook scores higher than a weak one", () => {
  const strong = A.analyze("In 1954 a jet broke apart over the sea. Nobody knew why. What could tear a plane in half?");
  const weak = A.analyze("Hello everyone, my name is Sam and today I will talk about planes and windows in general terms.");
  assert.ok(strong.scores.hook > weak.scores.hook);
});

test("detects 'and then' chains", () => {
  const r = A.analyze("He woke up and then he ate. And then he left. And then he came back.");
  assert.equal(r.metrics.andThen, 3);
  assert.ok(r.issues.some((i) => /and then/i.test(i.title)));
});

test("detects long gaps without a re-hook", () => {
  const filler = Array(40).fill("The engine ran at a steady speed for the whole flight.").join(" ");
  const r = A.analyze("Why did it fail? " + filler + " But then it stopped.", { wpm: 150, rehookGap: 60 });
  assert.ok(r.gaps.length >= 1);
  assert.ok(r.issues.some((i) => i.area === "Momentum" && /No re-hook/.test(i.title)));
});

test("ending signal flagged", () => {
  const body = Array(30).fill("But why does the bridge hold? You can see it in the triangle.").join(" ");
  const r = A.analyze(body + " So that's it for today, thanks for watching.");
  assert.ok(r.issues.some((i) => i.area === "Ending"));
});

test("section stats line up with sections", () => {
  const r = A.analyze([{ title: "A", text: "One two three." }, { title: "B", text: "" }, { title: "C", text: "Four five." }]);
  assert.equal(r.sectionStats.length, 3);
  assert.equal(r.sectionStats[0].words, 3);
  assert.equal(r.sectionStats[1].words, 0);
  assert.equal(r.sectionStats[2].words, 2);
  assert.ok(r.sectionStats[2].start > 0);
});

test("syllable heuristic is sane", () => {
  assert.equal(A.syllables("cat"), 1);
  assert.equal(A.syllables("window"), 2);
  assert.ok(A.syllables("concentration") >= 4);
});

test("scores are bounded 0..100", () => {
  const r = A.analyze("Hey guys welcome back subscribe. " + Array(80).fill("and then it was basically really very just done and then").join(" "));
  for (const v of Object.values(r.scores)) assert.ok(v >= 0 && v <= 100);
});
