/*
 * ScriptCraft "Add details" engine.
 *
 * Adds the user's facts, terms and details to a finished script WITHOUT
 * rewording it. Claude never returns the script: it only returns placements
 * ("after sentence 4 of section 2, insert this sentence"). This module applies
 * them locally, so every existing character is preserved by construction, and
 * verify() proves it.
 *
 * Pure functions — runs in the browser and in Node (for tests).
 */
(function (root) {
  "use strict";

  const KINDS = {
    fact: "Fact to add",
    term: "Term to define",
    detail: "Detail / colour",
    quote: "Quote (with source)",
  };

  /**
   * Split text into sentence units without changing it.
   * Returns [{start, end}] covering each sentence (trailing whitespace excluded).
   * Never splits inside [square brackets]; paragraph breaks always end a unit.
   */
  function segment(text) {
    const t = String(text || "");
    const units = [];
    let i = 0, start = -1, depth = 0;
    const close = (end) => {
      let e = end;
      while (e > start && /\s/.test(t[e - 1])) e--;
      if (start >= 0 && e > start) units.push({ start, end: e });
      start = -1;
    };
    while (i < t.length) {
      const c = t[i];
      if (start < 0) {
        if (!/\s/.test(c)) start = i;
        else { i++; continue; }
      }
      if (c === "[") depth++;
      else if (c === "]" && depth > 0) depth--;
      if (c === "\n" && t[i + 1] === "\n") { close(i); i++; continue; }
      if (depth === 0 && /[.!?…]/.test(c)) {
        let j = i + 1;
        while (j < t.length && /[.!?…"”’')\]]/.test(t[j])) j++;
        if (j >= t.length || /\s/.test(t[j])) { close(j); i = j; continue; }
      }
      i++;
    }
    if (start >= 0) close(t.length);
    return units;
  }

  /** Numbered view of the script for Claude: "S2.4 | sentence". */
  function numbered(sections) {
    return sections.map((s, si) => {
      const units = segment(s.text);
      const lines = units.map((u, k) => `S${si + 1}.${k + 1} | ${s.text.slice(u.start, u.end).replace(/\s+/g, " ")}`);
      return `## Section ${si + 1}: ${s.title}\n` + (lines.length ? lines.join("\n") : "(empty)");
    }).join("\n\n");
  }

  /**
   * @param {object} o
   * @param {{title:string,text:string}[]} o.sections
   * @param {{kind:string,text:string,source?:string,hint?:string}[]} o.additions
   * @param {object} [o.niche]  niche profile (name, rules)
   */
  function buildPrompt(o) {
    const adds = o.additions.map((a, i) =>
      `A${i + 1} [${KINDS[a.kind] || "Detail"}]: ${a.text.trim()}` +
      (a.source ? `\n   Source given by the writer: ${a.source.trim()}` : "") +
      (a.hint ? `\n   Writer's note on placement: ${a.hint.trim()}` : "")
    ).join("\n");
    const nicheLine = o.niche && o.niche.id !== "general"
      ? `\nThe channel's niche is "${o.niche.name}". New sentences must match its voice${o.niche.id === "spy" ? " (neutral third-person documentary narrator, no 'I', specific and precise)" : ""}.\n`
      : "";
    return `You are a YouTube script editor. A finished voiceover script is below, split into numbered sentences. The writer wants to add some facts, terms and details to it.

Your job: decide WHERE each addition belongs and write the NEW sentence(s) to insert there. You must not change, reword, reorder or delete any existing sentence. You only add.

Rules:
- Place each addition where it fits the story best: where its subject first comes up, or where it pays off a question or adds tension. Respect the writer's placement note if there is one.
- Write each insertion as one or two complete sentences in the same voice, tense and rhythm as the surrounding script, so it reads as if it was always there. Short connecting words inside YOUR new sentence are fine ("That's what…", "Records later showed…").
- Term to define: insert the definition right after the sentence where the term is first used, in plain spoken words (e.g. "Intelligence officers call this a dead drop: a hidden spot where…"). If the term isn't used yet, introduce it where the idea first appears.
- Fact or quote: keep the writer's facts exactly (names, numbers, dates, wording of quotes). Do not add new facts of your own. Attribute quotes to the source given.
- If an addition contradicts the script or fits nowhere sensibly, skip it and say why.
- "after": the sentence number to insert after, within that section. Use 0 to insert at the very start of the section.
${nicheLine}
<additions>
${adds}
</additions>

<voiceover_script>
${numbered(o.sections)}
</voiceover_script>

Reply with only this JSON:
{"placements":[{"addition":1,"section":2,"after":4,"text":"New sentence to insert.","reason":"Why it belongs here (one short line)"}],
 "skipped":[{"addition":3,"reason":"why"}],
 "sources":["each new factual claim the writer should verify, with the source if given"]}`;
  }

  /** Validate and normalise Claude's JSON. Drops anything out of range. */
  function normalise(raw, sections, additionCount) {
    const out = { placements: [], skipped: [], sources: [], dropped: 0 };
    const r = raw && typeof raw === "object" ? raw : {};
    (Array.isArray(r.placements) ? r.placements : []).forEach((p) => {
      const si = Number(p && p.section) - 1;
      const after = Number(p && p.after);
      const text = String((p && p.text) || "").replace(/\s+/g, " ").trim();
      const add = Number(p && p.addition);
      const sec = sections[si];
      if (!sec || !text || !Number.isInteger(after) || after < 0) { out.dropped++; return; }
      const n = segment(sec.text).length;
      out.placements.push({
        section: si, after: Math.min(after, n), text,
        addition: add >= 1 && add <= additionCount ? add : null,
        reason: String((p && p.reason) || "").trim(),
      });
    });
    (Array.isArray(r.skipped) ? r.skipped : []).forEach((s) => {
      out.skipped.push({ addition: Number(s && s.addition) || null, reason: String((s && s.reason) || "").trim() });
    });
    out.sources = (Array.isArray(r.sources) ? r.sources : []).map((x) => String(x).trim()).filter(Boolean);
    return out;
  }

  /**
   * Apply placements. Returns new sections plus the character ranges of every
   * inserted sentence: inserts = [{section, start, end, addition, reason, after}].
   */
  function apply(sections, placements) {
    const inserts = [];
    const next = sections.map((sec, si) => {
      const ps = placements.filter((p) => p.section === si);
      if (!ps.length) return { title: sec.title, text: sec.text };
      const t = sec.text;
      const units = segment(t);
      let out = "", pos = 0;
      const emit = (p, lead) => {
        out += lead;
        inserts.push({ section: si, start: out.length, end: out.length + p.text.length, addition: p.addition, reason: p.reason, after: p.after });
        out += p.text;
      };
      // Inserts at the very start of the section.
      const atStart = ps.filter((p) => p.after === 0);
      if (atStart.length) {
        const lead = units.length ? t.slice(0, units[0].start) : "";
        out += lead; pos = lead.length;
        atStart.forEach((p, k) => emit(p, k ? " " : ""));
        out += units.length ? " " : "";
      }
      units.forEach((u, k) => {
        out += t.slice(pos, u.end); pos = u.end;
        ps.filter((p) => p.after === k + 1).forEach((p) => emit(p, " "));
      });
      out += t.slice(pos);
      if (!units.length) ps.filter((p) => p.after > 0).forEach((p) => emit(p, out ? " " : ""));
      return { title: sec.title, text: out };
    });
    return { sections: next, inserts };
  }

  /** Prove the original text survives: remove inserted ranges (and their joining space) and compare. */
  function verify(before, after, inserts) {
    if (before.length !== after.length) return false;
    return before.every((sec, si) => {
      const mine = inserts.filter((x) => x.section === si).sort((a, b) => b.start - a.start);
      let t = after[si].text;
      mine.forEach((x) => {
        let s = x.start, e = x.end;
        if (t[s - 1] === " ") s--; else if (t[e] === " ") e++;
        t = t.slice(0, s) + t.slice(e);
      });
      return t === sec.text && after[si].title === sec.title;
    });
  }

  const API = { KINDS, segment, numbered, buildPrompt, normalise, apply, verify };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Enrich = API;
})(typeof window !== "undefined" ? window : globalThis);
