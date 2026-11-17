/*
 * ScriptCraft retention analyzer.
 * Pure functions, no DOM — runs in the browser and in Node (for tests).
 *
 * Heuristic, not magic: it flags patterns that research and creator practice
 * associate with drop-off (slow intros, long gaps with no new question,
 * "and then" chains, dense sentences, ending signals…).
 *
 * Text inside [square brackets] is treated as visual/B-roll notes and is NOT
 * counted as spoken words.
 */
(function (root) {
  "use strict";

  const RE = {
    turn: /\b(but|however|yet|except|until|instead|unless|turns out|it turns out|the problem( is)?|here'?s the (thing|catch|twist|problem|kicker)|what if|wait|surprisingly|the truth( is)?|plot twist|the weird (thing|part)|the strange (thing|part)|nobody|no one knew|mystery|secret)\b/i,
    therefore: /\b(therefore|so|which means|that'?s why|because of (this|that)|as a result|this meant|that meant|consequently|thus)\b/i,
    andThen: /\band then\b/gi,
    openLoop: /\b(later (in|on) (this|the) video|more on (that|this) later|(come|get) back to (that|this) later|in a (moment|minute|second|bit)|we'?ll (get|come) (to|back)|i'?ll (show|tell|explain)|by the end|stick around|coming up|but first|keep (that|this) in mind|remember (this|that)|more on (that|this)|hold that thought|we'?ll see)\b/i,
    stakes: /\b(risk|lose|lost|losing|death|die|died|dead|kill|killed|million|billion|trillion|danger|dangerous|disaster|catastroph\w*|collapse|never|forever|last chance|only|deadline|fail|failed|failure|crisis|war|survive|broke|bankrupt)\b/i,
    example: /\b(for example|for instance|imagine|picture (this|that|it)|think of|let'?s say|say you|like a|like an|it'?s like|is like|the same way|in other words|that'?s about|roughly the size|equivalent to)\b/i,
    number: /(\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|billion|trillion|percent|half|double|triple)\b)/i,
    you: /\b(you|your|you'?re|yourself|you'?ve|you'?ll|you'?d)\b/gi,
    passive: /\b(am|is|are|was|were|be|been|being)\s+(\w+ly\s+)?(\w{3,}ed|built|done|made|known|seen|given|taken|shown|written|found|told|thought|held|kept|sent|brought|caught|taught|bought|chosen|driven|eaten|forgotten|hidden|stolen|spoken)\b/gi,
  };

  const FILLERS = [
    "basically", "really", "very", "actually", "literally", "just", "kind of", "sort of",
    "pretty much", "you know", "i mean", "obviously", "simply", "quite", "somewhat",
    "in order to", "it is important to note", "it's important to note", "needless to say",
  ];

  const INTRO_KILLERS = [
    "hey guys", "hi guys", "hey everyone", "hi everyone", "hello everyone", "welcome back",
    "welcome to my channel", "welcome to the channel", "my name is", "in this video",
    "in today's video", "today's video", "before we start", "before we begin",
    "before we get started", "don't forget to", "subscribe", "smash that",
    "hit the bell", "let's get started", "let's get into it", "without further ado",
    "today we're going to talk about", "today i'm going to talk about", "this video is sponsored",
  ];

  const ENDING_SIGNALS = [
    "so that's it", "that's it for", "that's all for", "to wrap up", "to wrap things up",
    "in conclusion", "to sum up", "to summarize", "thanks for watching", "thank you for watching",
    "that's all i have", "see you next time", "see you in the next",
  ];

  const ok = (s) => typeof s === "string" && s.trim().length > 0;

  function stripVisualNotes(text) {
    return text.replace(/\[[^\]]*\]/g, " ");
  }

  function words(text) {
    return (text.match(/[A-Za-z0-9\u00C0-\u024F']+/g) || []);
  }

  function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }

  function splitSentences(text) {
    const clean = stripVisualNotes(text).replace(/\s+\n/g, "\n");
    const out = [];
    // Split on sentence enders and on blank lines / line breaks.
    const parts = clean.split(/(?<=[.!?…])\s+|\n+/);
    for (const p of parts) {
      const s = p.trim();
      if (s && words(s).length) out.push(s);
    }
    return out;
  }

  function countPhrases(lower, list) {
    const hits = [];
    for (const ph of list) {
      const re = new RegExp("\\b" + ph.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]?") + "\\b", "gi");
      const m = lower.match(re);
      if (m) hits.push({ phrase: ph, count: m.length });
    }
    return hits;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  /**
   * @param {string|Array<{title:string,text:string}>} input
   * @param {{wpm?:number, rehookGap?:number}} opts
   */
  function analyze(input, opts) {
    opts = opts || {};
    const wpm = opts.wpm || 150;
    const rehookGap = opts.rehookGap || 90; // seconds
    const sections = typeof input === "string" ? [{ title: "Script", text: input }] : input || [];

    const sentences = [];
    sections.forEach((sec, si) => {
      if (!ok(sec.text)) return;
      splitSentences(sec.text).forEach((s) => sentences.push({ text: s, section: si }));
    });

    let t = 0;
    let totalWords = 0;
    let totalSyll = 0;
    let complexWords = 0;
    for (const s of sentences) {
      const w = words(s.text);
      s.words = w.length;
      s.start = t;
      s.duration = (w.length / wpm) * 60;
      t += s.duration;
      totalWords += w.length;
      for (const x of w) {
        const sy = syllables(x);
        totalSyll += sy;
        if (sy >= 4) complexWords++;
      }
      const flags = [];
      if (/\?\s*$/.test(s.text)) flags.push("question");
      if (RE.turn.test(s.text)) flags.push("turn");
      if (RE.therefore.test(s.text)) flags.push("therefore");
      if (RE.openLoop.test(s.text)) flags.push("loop");
      if (RE.stakes.test(s.text)) flags.push("stakes");
      if (RE.example.test(s.text)) flags.push("example");
      if (/\band then\b/i.test(s.text)) flags.push("andthen");
      if (w.length > 25) flags.push("long");
      s.flags = flags;
      s.rehook = flags.includes("question") || flags.includes("turn") || flags.includes("loop");
    }
    const runtime = t;
    const fullText = sentences.map((s) => s.text).join(" ");
    const lower = fullText.toLowerCase();

    const issues = [];
    const add = (severity, area, title, detail, at) => issues.push({ severity, area, title, detail, at });

    if (!sentences.length) {
      return {
        empty: true, wpm, runtime: 0, runtimeLabel: "0:00", totalWords: 0, sentences: [],
        issues: [], gaps: [], scores: { hook: 0, momentum: 0, clarity: 0, engagement: 0, overall: 0 }, metrics: {},
        sectionStats: sections.map((s) => ({ title: s.title, words: 0, seconds: 0 })),
      };
    }

    // ---------------- HOOK ----------------
    let hook = 100;
    const hookWindowWords = Math.round((wpm / 60) * 15); // ~15 seconds
    const introWindowWords = Math.round((wpm / 60) * 30);
    const firstWords = words(fullText).slice(0, introWindowWords).join(" ").toLowerCase();
    const hookSentences = sentences.filter((s) => s.start < 15);
    const hookText = hookSentences.map((s) => s.text).join(" ");
    const killers = countPhrases(firstWords, INTRO_KILLERS);
    if (killers.length) {
      hook -= Math.min(45, killers.length * 20);
      add("high", "Hook", "Preamble in the first 30 seconds",
        "Found: " + killers.map((k) => "“" + k.phrase + "”").join(", ") +
        ". Greetings, channel intros and subscribe asks before the hook are where viewers leave. Start with the most intriguing moment instead.", 0);
    }
    const hookHasPull = /\?/.test(hookText) || RE.turn.test(hookText) || RE.stakes.test(hookText) ||
      RE.number.test(hookText) || RE.openLoop.test(hookText);
    if (!hookHasPull) {
      hook -= 30;
      add("high", "Hook", "Hook has no tension",
        "The first ~15 seconds contain no question, twist, stakes, surprising number or open loop. Give the viewer a reason to need the next sentence.", 0);
    }
    const firstSentence = sentences[0];
    if (firstSentence.words > 22) {
      hook -= 15;
      add("medium", "Hook", "First sentence is long (" + firstSentence.words + " words)",
        "Your opening line should hit fast. Try under ~15 words — split it or cut to the most surprising part.", 0);
    }
    const youInHook = (hookText.match(RE.you) || []).length;
    if (!youInHook && !/\?/.test(hookText)) {
      hook -= 10;
      add("low", "Hook", "Hook doesn't involve the viewer",
        "Consider addressing the viewer ('you') or asking them a question in the first 15 seconds.", 0);
    }
    if (totalWords < hookWindowWords) {
      add("info", "Hook", "Script is very short", "Analysis is more useful once you have at least a minute of script.", 0);
    }

    // ---------------- MOMENTUM ----------------
    let momentum = 100;
    const markers = sentences.filter((s) => s.rehook).map((s) => s.start);
    const points = [0].concat(markers, [runtime]);
    const gaps = [];
    for (let i = 1; i < points.length; i++) {
      const g = points[i] - points[i - 1];
      if (g > rehookGap) gaps.push({ from: points[i - 1], to: points[i], len: g });
    }
    gaps.forEach((g) => {
      momentum -= Math.min(20, 8 + (g.len - rehookGap) / 10);
      add("high", "Momentum", "No re-hook for " + Math.round(g.len) + "s (" + fmtTime(g.from) + "–" + fmtTime(g.to) + ")",
        "Nothing new pulls the viewer forward here — no question, twist ('but…', 'turns out…') or open loop. Add a complication, raise the stakes, or tease what's coming.", g.from);
    });

    const andThen = (fullText.match(RE.andThen) || []).length;
    const buts = sentences.filter((s) => s.flags.includes("turn")).length;
    const therefores = sentences.filter((s) => s.flags.includes("therefore")).length;
    if (andThen >= 2) {
      momentum -= Math.min(20, andThen * 5);
      add("medium", "Momentum", "'And then' used " + andThen + " times",
        "Parker & Stone's rule: beats joined by 'and then' feel like a list. Rewrite them as 'but' (complication) or 'therefore' (consequence).",
        (sentences.find((s) => s.flags.includes("andthen")) || {}).start);
    }
    const minutes = runtime / 60;
    if (minutes >= 1 && buts / minutes < 1) {
      momentum -= 12;
      add("medium", "Momentum", "Few turns / complications",
        "Only " + buts + " 'but / however / turns out' moments. Stories move on conflict — aim for at least one complication per minute.", null);
    }
    const questions = sentences.filter((s) => s.flags.includes("question")).length;
    const loops = sentences.filter((s) => s.flags.includes("loop")).length;
    if (minutes >= 2 && loops === 0) {
      momentum -= 8;
      add("low", "Momentum", "No explicit open loops",
        "Tease something you'll pay off later ('…and that's where it gets strange — but first…'). Remember to close every loop you open.", null);
    }

    // Ending
    const endWindowStart = runtime * 0.85;
    const endText = sentences.filter((s) => s.start >= endWindowStart).map((s) => s.text).join(" ").toLowerCase();
    const endHits = countPhrases(endText, ENDING_SIGNALS);
    if (endHits.length && minutes >= 1) {
      momentum -= 6;
      add("medium", "Ending", "Ending signal detected",
        "Phrases like " + endHits.map((h) => "“" + h.phrase + "”").join(", ") +
        " tell viewers the value is over, so they leave. End on your payoff line, then bridge to a specific next video.", endWindowStart);
    }

    // ---------------- CLARITY ----------------
    let clarity = 100;
    const avgLen = totalWords / sentences.length;
    const longSentences = sentences.filter((s) => s.words > 25);
    const flesch = 206.835 - 1.015 * avgLen - 84.6 * (totalSyll / Math.max(1, totalWords));
    if (avgLen > 20) {
      clarity -= Math.min(25, (avgLen - 20) * 3);
      add("medium", "Clarity", "Average sentence is " + avgLen.toFixed(1) + " words",
        "Spoken scripts work best around 10–18 words per sentence. Listeners can't re-read.", null);
    }
    if (longSentences.length) {
      clarity -= Math.min(25, longSentences.length * 4);
      add(longSentences.length > 3 ? "medium" : "low", "Clarity", longSentences.length + " sentence(s) over 25 words",
        "Long sentences make the narrator run out of breath and the viewer lose the thread. Split them.", longSentences[0].start);
    }
    if (flesch < 50) {
      clarity -= 15;
      add("medium", "Clarity", "Dense language (readability " + Math.round(flesch) + ")",
        "Aim for 60+ on the Flesch scale for narration. Swap long words for short ones and explain jargon with an analogy.", null);
    }
    const passives = (fullText.match(RE.passive) || []);
    if (passives.length / sentences.length > 0.15) {
      clarity -= 10;
      add("low", "Clarity", "Lots of passive voice (" + passives.length + ")",
        "e.g. “" + passives.slice(0, 3).join("”, “") + "”. Active voice ('the engineers built…') is punchier than passive ('it was built…').", null);
    }
    const fillers = countPhrases(lower, FILLERS);
    const fillerCount = fillers.reduce((a, b) => a + b.count, 0);
    if (fillerCount / Math.max(1, totalWords) > 0.015) {
      clarity -= Math.min(15, fillerCount * 2);
      add("low", "Clarity", "Filler words (" + fillerCount + ")",
        fillers.sort((a, b) => b.count - a.count).slice(0, 6).map((f) => f.phrase + " ×" + f.count).join(", ") +
        ". Cut them unless they carry meaning.", null);
    }
    // Uniform sentence length sounds robotic.
    if (sentences.length >= 8) {
      const mean = avgLen;
      const sd = Math.sqrt(sentences.reduce((a, s) => a + Math.pow(s.words - mean, 2), 0) / sentences.length);
      if (sd < 3.5) {
        clarity -= 8;
        add("low", "Clarity", "Sentence lengths are monotonous",
          "Vary your rhythm: a long sentence that builds, then a short one. Like this.", null);
      }
    }

    // ---------------- ENGAGEMENT ----------------
    let engagement = 100;
    const youCount = (fullText.match(RE.you) || []).length;
    const youPer100 = (youCount / Math.max(1, totalWords)) * 100;
    if (youPer100 < 1) {
      engagement -= 20;
      add("medium", "Engagement", "Rarely talks to the viewer",
        "'You' appears " + youCount + " times. Pull the viewer in: 'Imagine you're…', 'You've probably heard…'.", null);
    }
    const examples = sentences.filter((s) => s.flags.includes("example")).length;
    if (minutes >= 1.5 && examples / minutes < 0.4) {
      engagement -= 18;
      add("medium", "Engagement", "Few concrete examples or analogies",
        "Only " + examples + " example/analogy markers ('imagine', 'for example', 'it's like…'). Every abstract idea needs something the viewer can picture.", null);
    }
    const numbers = sentences.filter((s) => RE.number.test(s.text)).length;
    if (minutes >= 1.5 && numbers === 0) {
      engagement -= 8;
      add("low", "Engagement", "No specific numbers",
        "Specific figures (dates, amounts, sizes) make a story feel real and credible.", null);
    }
    if (minutes >= 1.5 && questions / minutes < 0.5) {
      engagement -= 12;
      add("low", "Engagement", "Few questions",
        "Questions make viewers think before you answer — this is when curiosity (and learning) peaks.", null);
    }
    const stakes = sentences.filter((s) => s.flags.includes("stakes")).length;
    if (minutes >= 2 && stakes === 0) {
      engagement -= 10;
      add("low", "Engagement", "No stakes language",
        "What could be won or lost? Make consequences explicit — money, lives, time, reputation.", null);
    }

    const scores = {
      hook: clamp(Math.round(hook), 0, 100),
      momentum: clamp(Math.round(momentum), 0, 100),
      clarity: clamp(Math.round(clarity), 0, 100),
      engagement: clamp(Math.round(engagement), 0, 100),
    };
    scores.overall = Math.round(scores.hook * 0.3 + scores.momentum * 0.3 + scores.clarity * 0.2 + scores.engagement * 0.2);

    const order = { high: 0, medium: 1, low: 2, info: 3 };
    issues.sort((a, b) => order[a.severity] - order[b.severity]);

    const sectionStats = sections.map((sec, i) => {
      const ss = sentences.filter((s) => s.section === i);
      const w = ss.reduce((a, s) => a + s.words, 0);
      return { title: sec.title, words: w, seconds: (w / wpm) * 60, start: ss.length ? ss[0].start : null };
    });

    return {
      empty: false,
      wpm,
      runtime,
      runtimeLabel: fmtTime(runtime),
      totalWords,
      sentences,
      issues,
      scores,
      sectionStats,
      gaps,
      metrics: {
        sentences: sentences.length,
        avgSentence: +avgLen.toFixed(1),
        readability: Math.round(flesch),
        complexWordPct: +((complexWords / totalWords) * 100).toFixed(1),
        questions,
        turns: buts,
        therefores,
        andThen,
        openLoops: loops,
        examples,
        youPer100: +youPer100.toFixed(1),
        rehooks: markers.length,
        longestGap: Math.round(Math.max(0, ...points.slice(1).map((p, i) => p - points[i]))),
        fillerCount,
      },
    };
  }

  const API = { analyze, splitSentences, syllables, words, fmtTime, stripVisualNotes };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Analyzer = API;
})(typeof window !== "undefined" ? window : globalThis);
