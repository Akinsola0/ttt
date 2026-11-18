/*
 * ScriptCraft "Road to 100" engine.
 * - breakdown(): which issues cost which score how many points (from the analyzer)
 * - buildPrompt(): asks Claude for small, targeted line edits as JSON
 * - normalise(): validates Claude's edits against the script
 * - applyEdits(): applies replace / insert_after / delete edits by sentence
 * - impact(): re-scores the script with an edit set to show the real gain
 * Pure functions — runs in the browser and in Node (for tests).
 */
(function (root) {
  "use strict";
  const isNode = typeof module !== "undefined" && module.exports;
  const E = isNode ? require("./enrich.js") : root.Enrich;
  const A = isNode ? require("./analyzer.js") : root.Analyzer;

  const AREAS = [
    { key: "hook", label: "Hook" },
    { key: "momentum", label: "Momentum" },
    { key: "clarity", label: "Clarity" },
    { key: "engagement", label: "Engagement" },
  ];

  const AREA_GUIDE = {
    hook: "The first ~15 seconds must hold a question, twist, stakes, a surprising number or an open loop; the first sentence should be under ~15 words; no greetings or channel plugs in the first 30 seconds; involve the viewer ('you' or a direct question).",
    momentum: "A re-hook (a question, 'but…', 'turns out…', 'here's the thing', or an open loop such as 'we'll come back to that in a moment') at least every 60–90 seconds; replace 'and then' with but/therefore; at least one complication per minute; tease something to pay off later; no 'so that's it' / 'thanks for watching' near the end.",
    clarity: "Spoken sentences of about 10–18 words; split any sentence over 25 words; short, plain words; active voice; cut filler (basically, really, very, just, actually, literally); vary sentence length.",
    engagement: "Talk to the viewer with 'you' (at least ~1 per 100 words); give abstract ideas an example or analogy ('imagine…', 'it's like…', 'for example'); use specific numbers; ask questions before answering; make stakes explicit (what could be lost, risked, or won).",
  };

  function breakdown(result) {
    return AREAS.map((a) => {
      const items = (result.issues || []).filter((i) => i.score === a.key && i.points > 0);
      return { key: a.key, label: a.label, score: result.scores ? result.scores[a.key] : 0, items };
    });
  }

  /**
   * @param {object} o
   * @param {{title,text}[]} o.sections
   * @param {object} o.result     Analyzer result for these sections
   * @param {string[]} o.areas    score keys to improve
   * @param {object[]} [o.nicheFails]  failed niche checks {label, why}
   * @param {object} [o.niche]
   * @param {number} o.wpm
   */
  function buildPrompt(o) {
    const bd = breakdown(o.result).filter((b) => o.areas.includes(b.key));
    const problems = bd.map((b) =>
      `${b.label}: ${b.score}/100\n` +
      (b.items.length ? b.items.map((i) => `  - (−${i.points}) ${i.title}: ${i.detail}${i.at != null ? ` [around ${A.fmtTime(i.at)}]` : ""}`).join("\n") : "  - no deductions") +
      `\n  What scores well: ${AREA_GUIDE[b.key]}`
    ).join("\n\n");
    const niche = o.nicheFails && o.nicheFails.length
      ? `\n<niche_checks_failing>\n${o.nicheFails.map((c) => `- ${c.label}: ${c.why}`).join("\n")}\n</niche_checks_failing>\n` : "";
    const voice = o.niche && o.niche.id === "spy" ? " Keep the neutral third-person documentary narrator: never 'I', but 'you' addressed to the viewer is fine." : "";
    return `You are a YouTube script editor improving a script's retention scores. The script below is split into numbered sentences (about ${o.wpm} spoken words per minute, so the hook window is roughly the first ${Math.round(o.wpm / 4)} words). Text in [square brackets] is visual notes, not spoken.

Suggest a small set of targeted edits that raise the scores listed below toward 100, while keeping the story, the facts and the voice intact.${voice}

<scores_to_improve>
${problems}
</scores_to_improve>
${niche}
Rules:
- Each edit changes ONE sentence: "replace" (rewrite it), "insert_after" (add one or two new sentences after it; use sentence 0 for the start of a section) or "delete".
- Prefer the smallest change that fixes a deduction. Never invent new facts, names, numbers or quotes; reuse what the script already says.
- Keep the writer's voice, tense and rhythm. Keep any [visual notes] that are in a sentence you replace.
- Give 3–10 edits, the most valuable first. Don't suggest edits for scores already at 100.

<voiceover_script>
${E.numbered(o.sections)}
</voiceover_script>

Reply with only this JSON:
{"edits":[{"area":"hook","section":1,"sentence":1,"action":"replace","text":"New sentence.","why":"Short reason tied to the deduction"}]}`;
  }

  function normalise(raw, sections) {
    const out = [];
    const list = raw && Array.isArray(raw.edits) ? raw.edits : Array.isArray(raw) ? raw : [];
    list.forEach((e) => {
      const si = Number(e && e.section) - 1;
      const sec = sections[si];
      const action = String((e && e.action) || "").toLowerCase();
      const sentence = Number(e && e.sentence);
      const text = String((e && e.text) || "").replace(/\s+/g, " ").trim();
      if (!sec || !["replace", "insert_after", "delete"].includes(action) || !Number.isInteger(sentence)) return;
      const n = E.segment(sec.text).length;
      if (action === "insert_after" ? (sentence < 0 || sentence > n || !text) : (sentence < 1 || sentence > n)) return;
      if (action === "replace" && !text) return;
      const original = action === "insert_after" ? "" : (() => { const u = E.segment(sec.text)[sentence - 1]; return sec.text.slice(u.start, u.end); })();
      if (action === "replace" && original === text) return;
      out.push({
        id: out.length, area: AREAS.some((a) => a.key === e.area) ? e.area : null,
        section: si, sentence, action, text, original, why: String((e && e.why) || "").trim(),
      });
    });
    return out;
  }

  /** Apply edits. Returns {sections, marks:[{section,start,end}]} with changed text marked. */
  function applyEdits(sections, edits) {
    const marks = [];
    const next = sections.map((sec, si) => {
      const mine = edits.filter((e) => e.section === si);
      if (!mine.length) return { title: sec.title, text: sec.text };
      const t = sec.text;
      const units = E.segment(t);
      let out = "", pos = 0, prevDeleted = false;
      const mark = (txt, e) => { marks.push({ section: si, start: out.length, end: out.length + txt.length, reason: (e && e.why) || "" }); out += txt; };
      const starts = mine.filter((e) => e.action === "insert_after" && e.sentence === 0);
      if (starts.length) {
        out += units.length ? t.slice(0, units[0].start) : "";
        pos = out.length;
        starts.forEach((e, k) => { if (k) out += " "; mark(e.text, e); });
        if (units.length) out += " ";
      }
      units.forEach((u, k) => {
        const n = k + 1;
        let gap = t.slice(pos, u.start);
        const del = mine.find((e) => e.sentence === n && e.action === "delete");
        const rep = !del && mine.find((e) => e.sentence === n && e.action === "replace");
        if (prevDeleted && !/\n/.test(gap) && (/\s$/.test(out) || !out)) gap = "";
        else if (prevDeleted && /\n/.test(gap)) out = out.replace(/[ \t]+$/, "");
        if (del) {
          if (/\n/.test(gap)) out += gap; // keep paragraph breaks
          prevDeleted = true;
        } else {
          out += gap;
          if (rep) mark(rep.text, rep); else out += t.slice(u.start, u.end);
          prevDeleted = false;
        }
        pos = u.end;
        mine.filter((e) => e.action === "insert_after" && e.sentence === n).forEach((e) => { if (out && !/\s$/.test(out)) out += " "; mark(e.text, e); prevDeleted = false; });
      });
      let rest = t.slice(pos);
      if (prevDeleted) { out = out.replace(/[ \t]+$/, ""); rest = rest.replace(/^[ \t]+/, ""); }
      out += rest;
      return { title: sec.title, text: out };
    });
    return { sections: next, marks };
  }

  /** Re-score with the given edits applied; returns scores and the change versus base. */
  function impact(sections, edits, opts) {
    const base = A.analyze(sections, opts);
    const after = A.analyze(applyEdits(sections, edits).sections, opts);
    const delta = {};
    ["overall"].concat(AREAS.map((a) => a.key)).forEach((k) => (delta[k] = after.scores[k] - base.scores[k]));
    return { base: base.scores, after: after.scores, delta };
  }

  const API = { AREAS, breakdown, buildPrompt, normalise, applyEdits, impact };
  if (isNode) module.exports = API;
  else root.Boost = API;
})(typeof window !== "undefined" ? window : globalThis);
