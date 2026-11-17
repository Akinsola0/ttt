/*
 * ScriptCraft rewrite engine: builds the instruction prompt that turns a pasted
 * draft into a finished script, and parses Claude's answer back into sections.
 * Pure functions — runs in the browser and in Node (for tests).
 */
(function (root) {
  "use strict";

  const KB = (typeof module !== "undefined" && module.exports) ? require("./niches.js") : root.KB;

  function bullet(list) { return list.map((x) => "- " + x).join("\n"); }

  /**
   * @param {object} o
   * @param {string} o.text      the pasted draft / notes
   * @param {string} [o.topic]
   * @param {string} [o.audience]
   * @param {number} o.minutes   target length
   * @param {number} o.wpm
   * @param {string} o.styleId
   * @param {string} o.templateId  "auto" or a template id
   * @param {object} [o.analysis] result of Analyzer.analyze on the draft
   * @param {string} [o.nicheId]
   */
  function buildPrompt(o) {
    const style = KB.STYLES.find((s) => s.id === o.styleId) || KB.STYLES[0];
    const tid = o.templateId === "auto" ? style.template : o.templateId;
    const tpl = KB.TEMPLATES.find((t) => t.id === tid) || KB.TEMPLATES[0];
    const words = Math.round(o.minutes * o.wpm);
    const totalPct = tpl.sections.reduce((a, s) => a + s.pct, 0) || 1;

    const principles = KB.PLAYBOOK.map((th) =>
      th.theme + "\n" + th.items.map((it) => "- " + it.t + ": " + it.d).join("\n")
    ).join("\n\n");

    const structure = tpl.sections.map((s, i) => {
      const w = Math.round((s.pct / totalPct) * words);
      return `${i + 1}. ${s.title} (~${w} words) — ${s.purpose}`;
    }).join("\n");

    const niche = (KB.NICHES || []).find((n) => n.id === o.nicheId);
    let nicheBlock = "";
    if (niche && niche.id !== "general") {
      nicheBlock = `\n<niche>\nYouTube niche: ${niche.name}. ${niche.tagline}\nAudience: ${niche.audience}\n` +
        (niche.wants.length ? `What this audience wants:\n${bullet(niche.wants)}\n` : "") +
        (niche.rules.length ? `Niche rules (follow all):\n${bullet(niche.rules)}\n` : "") +
        (niche.pitfalls.length ? `Avoid these niche pitfalls:\n${bullet(niche.pitfalls)}\n` : "") +
        (niche.hooks.length ? `Example hooks that fit this niche (for tone only, do not copy):\n${bullet(niche.hooks)}\n` : "") +
        (niche.checks.length ? `The finished script must pass these checks:\n${bullet(niche.checks.map((c) => c.label + " — " + c.why))}\n` : "") +
        (niche.titles.length ? `Title patterns that work in this niche:\n${bullet(niche.titles)}\n` : "") +
        (niche.thumbnails ? `Thumbnail guidance: ${niche.thumbnails}\n` : "") +
        `</niche>\n`;
    }

    let diagnosis = "";
    if (o.analysis && !o.analysis.empty) {
      const a = o.analysis;
      diagnosis = `\n<diagnosis>\nAn automated retention check of the draft scored it ${a.scores.overall}/100 ` +
        `(hook ${a.scores.hook}, momentum ${a.scores.momentum}, clarity ${a.scores.clarity}, engagement ${a.scores.engagement}). ` +
        `Problems it found, which your version must fix:\n` +
        (a.issues.length ? bullet(a.issues.slice(0, 12).map((i) => `${i.title}: ${i.detail}`)) : "- none major") +
        `\n</diagnosis>\n`;
    }

    return `You are an expert YouTube scriptwriter for educational storytelling channels. Your scripts teach real knowledge while telling a story that keeps viewers watching to the end.

Rewrite the draft below into a finished, ready-to-record voiceover script.

<brief>
Topic: ${o.topic || "(infer it from the draft)"}
Audience: ${o.audience || "curious general audience, no specialist knowledge"}
Target length: about ${o.minutes} minutes, about ${words} spoken words at ${o.wpm} words per minute
Writer style: ${style.name} (${style.inspired}). ${style.summary}
</brief>

<style_rules>
${bullet(style.rules)}
</style_rules>

<structure>
Use this section structure (${tpl.name}). Adapt section titles to the topic, but keep their job and order:
${structure}
</structure>

<retention_and_teaching_principles>
${principles}
</retention_and_teaching_principles>

<hard_rules>
- Hook in the first 15 seconds (about ${Math.round(o.wpm / 4)} words): no greetings, no "in this video", no channel intro, no subscribe ask.
- State the main question (open loop) early and answer it near the end. Close every loop you open.
- Connect beats with BUT or THEREFORE, never AND THEN.
- Add a re-hook (new question, twist, stakes escalation or teaser) at least every 60–90 seconds.
- Name at least one common misconception and correct it.
- Give every abstract idea a concrete example, analogy or specific number.
- Write for the ear: conversational, contractions, mostly 8–18 words per sentence with varied rhythm, talk to "you".
- No filler words (basically, really, very, literally, just).
- End on a callback to the opening and a specific bridge to a next video. Never "so that's it" or "thanks for watching".
- Put a short visual / B-roll note in [square brackets] where it helps the editor.
- Accuracy matters: keep the facts from the draft. Do not invent statistics, quotes, dates or names. If the story needs a fact the draft doesn't give, write it in and flag it as [CHECK: what to verify].
</hard_rules>
${nicheBlock}${diagnosis}
<draft>
${o.text.trim()}
</draft>

Reply in exactly this format, with no other text before or after:

=== TITLES ===
1. (title option, under 60 characters)
2. (title option)
3. (title option)
=== THUMBNAIL ===
(one-line thumbnail concept: one image, one emotion, at most 3 words of text)
=== SCRIPT ===
## (Section title)
(narration with [visual notes])

## (Next section title)
(…)
=== CHANGES ===
- (what you changed and which rule it serves; 5–8 bullets)
=== SOURCES TO CHECK ===
- (each factual claim the viewer will take as true that should be verified, and where to verify it; mark anything you added or are unsure of)`;
  }

  function between(text, start, end) {
    const i = text.indexOf(start);
    if (i < 0) return "";
    const from = i + start.length;
    const j = end ? text.indexOf(end, from) : -1;
    return text.slice(from, j < 0 ? undefined : j).trim();
  }

  /** Parse Claude's answer. Tolerant of partial (streaming) answers. */
  function parse(text) {
    const t = String(text || "").replace(/\r/g, "");
    const titles = between(t, "=== TITLES ===", "===")
      .split("\n").map((l) => l.replace(/^\s*(\d+[.)]|[-*])\s*/, "").trim()).filter(Boolean);
    const thumbnail = between(t, "=== THUMBNAIL ===", "===");
    const scriptRaw = t.includes("=== SCRIPT ===") ? between(t, "=== SCRIPT ===", "=== CHANGES ===") : (t.includes("===") ? "" : t.trim());
    const changes = between(t, "=== CHANGES ===", "=== SOURCES TO CHECK ===")
      .split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);

    const sources = between(t, "=== SOURCES TO CHECK ===", null)
      .split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
    const sections = [];
    let curr = null;
    scriptRaw.split("\n").forEach((line) => {
      const h = line.match(/^\s*#{1,4}\s+(.*)$/);
      if (h) {
        curr = { title: h[1].replace(/\*+/g, "").trim() || "Section", text: "" };
        sections.push(curr);
      } else {
        if (!curr) { if (!line.trim()) return; curr = { title: "Script", text: "" }; sections.push(curr); }
        curr.text += line + "\n";
      }
    });
    sections.forEach((s) => (s.text = s.text.replace(/\n{3,}/g, "\n\n").trim()));
    return { titles, thumbnail, sections: sections.filter((s) => s.text || s.title), changes, sources };
  }

  const API = { buildPrompt, parse };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Rewrite = API;
})(typeof window !== "undefined" ? window : globalThis);
