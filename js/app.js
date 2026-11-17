/* ScriptCraft — main UI. Vanilla JS, no build step. */
(function () {
  "use strict";
  const { TEMPLATES, HOOKS, PLAYBOOK, CHECKLIST, SOURCES } = window.KB;
  const A = window.Analyzer;
  const STORE_KEY = "scriptcraft.v1";

  // ------------------------------------------------------------------ utils
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = A.fmtTime;
  function debounce(fn, ms) {
    let t;
    return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(null, a), ms); };
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2200);
  }
  // In-page confirm (native confirm() is blocked in sandboxed viewers).
  function askConfirm(msg, okLabel) {
    return new Promise((resolve) => {
      const box = $("#confirmBox");
      $("#confirmMsg").textContent = msg;
      $("#confirmOk").textContent = okLabel || "OK";
      box.hidden = false;
      $("#confirmOk").focus();
      const done = (v) => { box.hidden = true; $("#confirmOk").onclick = $("#confirmCancel").onclick = null; resolve(v); };
      $("#confirmOk").onclick = () => done(true);
      $("#confirmCancel").onclick = () => done(false);
    });
  }
  // Downloads don't work inside an embedded viewer, so offer copy instead there.
  const EMBEDDED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  if (EMBEDDED) $$("#exportMenu [data-export], #exportMenu .file-only").forEach((b) => (b.hidden = true));

  function copy(text) {
    const done = () => toast("Copied to clipboard");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Couldn't copy"); }
    ta.remove();
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slug = (s) => (s || "script").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "script";

  // ------------------------------------------------------------------ state
  function sectionsFromTemplate(tid) {
    const t = TEMPLATES.find((x) => x.id === tid) || TEMPLATES[0];
    return t.sections.map((s) => ({ id: uid(), title: s.title, purpose: s.purpose, prompts: s.prompts.slice(), pct: s.pct, text: "" }));
  }
  function newProject(tid, name) {
    return {
      id: uid(), name: name || "Untitled script", templateId: tid || "edu-story",
      wpm: 150, targetMin: 10,
      meta: { topic: "", title: "", thumb: "", promise: "", question: "" },
      sections: sectionsFromTemplate(tid || "edu-story"),
      story: { abt: { and: "", but: "", therefore: "" }, beats: [{ text: "", conn: "but" }, { text: "", conn: "therefore" }, { text: "", conn: "but" }], myth: {} },
      checklist: {},
      updated: Date.now(),
    };
  }
  function demoProject() {
    const p = newProject("edu-story", "Demo — Why airplane windows are round");
    p.targetMin = 3;
    p.meta = {
      topic: "Why airplane windows are round",
      title: "The Deadly Reason Plane Windows Are Round",
      thumb: "Square window with a crack spreading from the corner — 'FATAL?'",
      promise: "You'll understand why sharp corners break things — and see it everywhere.",
      question: "Why did the world's most advanced jet keep falling out of the sky?",
    };
    const T = [
      "January 1954. A brand-new jet airliner is cruising over the Mediterranean. [Wide shot: Comet in blue sky] Then, with no warning at all, it breaks apart in mid-air. Three months later, it happens again. Same aircraft type. Same mystery.",
      "This was the de Havilland Comet — the most advanced passenger jet in the world. And the answer to why it kept falling out of the sky is hiding in a shape you've seen on every flight you've ever taken. By the end of this video, you'll never look at a plane window the same way again.",
      "So what do you think brings down a plane like that? Most people would guess a bomb, an engine fire, or pilot error. Investigators thought so too. It's a reasonable guess — those are the things that usually go wrong. But none of them fit the evidence.",
      "Here's what you need to know about the Comet. [Archive footage: Comet launch] It flew higher and faster than any airliner before it. To keep passengers alive at that altitude, the cabin was pumped full of air — like a balloon being inflated on every single flight, and let down again on landing.",
      "Investigators pulled wreckage from the sea floor near Elba. They found no trace of a bomb. The engines looked fine. So what's left? The plane had simply torn itself apart. But how does a metal tube just rip open?",
      "Therefore engineers did something extraordinary. They put an entire Comet fuselage in a giant water tank and pressurised it again and again, simulating thousands of flights. [Tank test footage] Wait for it. After roughly three thousand simulated flights, the fuselage burst open.",
      "And here's the twist. The crack didn't start just anywhere. It started at the corner of a square cut-out in the cabin roof. The sharp corner was the weak point.",
      "Imagine you're tearing a sheet of paper. If it's a smooth edge, it's surprisingly hard to start. But make a tiny nick, and it rips instantly. A sharp corner works like that nick. Stress flows around a hole like water around a rock — and at a sharp corner, it all piles up into one tiny spot. A round edge spreads that stress out evenly. That's called stress concentration, and it's why every window you've flown next to has rounded corners.",
      "Once you see it, you see it everywhere. It's why cracks in your phone screen start at the corners. It's why ship hatches are rounded, and why engineers drill a small round hole at the end of a crack to stop it growing. One sharp corner cost dozens of lives — and changed how every aircraft since has been built.",
      "So the next time you're on a plane, look at the window next to you. That gentle curve isn't a design choice. It's a lesson written in the wreckage of the Comet. And if you want to see what happens when engineers ignore a lesson like this, watch this next — it's even stranger.",
    ];
    p.sections.forEach((s, i) => (s.text = T[i] || ""));
    p.story.abt = {
      and: "In the 1950s the Comet was the fastest, highest-flying airliner in the world, and it was the future of travel",
      but: "within a year, two of them broke apart in mid-air and nobody knew why",
      therefore: "engineers tested a whole fuselage in a water tank and discovered that sharp corners concentrate stress — which is why every plane window today is round",
    };
    return p;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.projects) && s.projects.length) return s;
      }
    } catch (e) { /* storage unavailable */ }
    const demo = demoProject();
    return { projects: [demo], currentId: demo.id };
  }
  let state = load();
  const persist = debounce(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, 300);
  function cur() {
    let p = state.projects.find((x) => x.id === state.currentId);
    if (!p) { p = state.projects[0]; state.currentId = p.id; }
    return p;
  }
  function touch() { cur().updated = Date.now(); persist(); }
  function analysis(opts) {
    const p = cur();
    return A.analyze(p.sections.map((s) => ({ title: s.title, text: s.text })), Object.assign({ wpm: p.wpm }, opts || {}));
  }

  // ------------------------------------------------------------------ top bar
  function renderProjectSelect() {
    const sel = $("#projectSelect");
    sel.innerHTML = state.projects
      .slice().sort((a, b) => b.updated - a.updated)
      .map((p) => `<option value="${p.id}" ${p.id === state.currentId ? "selected" : ""}>${esc(p.name)}</option>`).join("");
  }
  $("#projectSelect").addEventListener("change", (e) => { state.currentId = e.target.value; persist(); renderAll(); });
  $("#newProjectBtn").addEventListener("click", () => {
    const tid = $("#templateSelect").value || "edu-story";
    const p = newProject(tid, "New script " + (state.projects.length + 1));
    state.projects.push(p); state.currentId = p.id; persist(); renderAll();
    $("#metaName").focus(); $("#metaName").select();
  });
  $("#deleteProjectBtn").addEventListener("click", async () => {
    const p = cur();
    if (!(await askConfirm(`Delete “${p.name}”? This can't be undone. Export a backup first if you're unsure.`, "Delete script"))) return;
    state.projects = state.projects.filter((x) => x.id !== p.id);
    if (!state.projects.length) state.projects.push(newProject("edu-story"));
    state.currentId = state.projects[0].id; persist(); renderAll();
  });

  // Tabs
  function showTab(name) {
    $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    if (name === "analyze") renderAnalyze();
    if (name === "playbook") renderChecklist();
    if (name === "story") renderStory();
    window.scrollTo(0, 0);
  }
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) showTab(g.dataset.goto);
  });

  // Export menu
  $("#exportBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#exportMenu").hidden = !$("#exportMenu").hidden; });
  document.addEventListener("click", (e) => { if (!e.target.closest(".menu")) $("#exportMenu").hidden = true; });
  $$("#exportMenu [data-export]").forEach((b) => b.addEventListener("click", () => {
    const p = cur();
    const kind = b.dataset.export;
    if (kind === "md") download(slug(p.name) + ".md", toMarkdown(p), "text/markdown");
    if (kind === "txt") download(slug(p.name) + ".txt", toNarration(p), "text/plain");
    if (kind === "json") download("scriptcraft-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(state, null, 2), "application/json");
    $("#exportMenu").hidden = true;
  }));
  $$("#exportMenu [data-copy-export]").forEach((b) => b.addEventListener("click", () => {
    const p = cur();
    const kind = b.dataset.copyExport;
    copy(kind === "md" ? toMarkdown(p) : kind === "txt" ? toNarration(p) : JSON.stringify(state));
    $("#exportMenu").hidden = true;
  }));
  $("#importPasteBtn").addEventListener("click", () => {
    $("#exportMenu").hidden = true;
    $("#importPaste").value = "";
    $("#importBox").hidden = false;
    $("#importPaste").focus();
  });
  $("#importCancel").addEventListener("click", () => ($("#importBox").hidden = true));
  $("#importOk").addEventListener("click", () => {
    if (importText($("#importPaste").value)) $("#importBox").hidden = true;
  });
  $("#importFile").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { importText(r.result); e.target.value = ""; };
    r.readAsText(f);
  });
  function importText(raw) {
      try {
        const data = JSON.parse(raw);
        const list = Array.isArray(data.projects) ? data.projects : (data.sections ? [data] : null);
        if (!list) throw new Error("Not a ScriptCraft backup");
        let n = 0;
        list.forEach((p) => {
          if (!p || !Array.isArray(p.sections)) return;
          const base = newProject(p.templateId);
          const merged = Object.assign(base, p, { id: uid(), updated: Date.now() });
          merged.sections = p.sections.map((s) => Object.assign({ id: uid(), title: "Section", purpose: "", prompts: [], pct: 10, text: "" }, s, { id: uid() }));
          merged.meta = Object.assign(base.meta, p.meta || {});
          merged.story = Object.assign(newProject().story, p.story || {});
          state.projects.push(merged); n++;
          state.currentId = merged.id;
        });
        persist(); renderAll(); toast(`Imported ${n} script(s)`);
        return true;
      } catch (err) { toast("Import failed: " + err.message); return false; }
  }

  function toMarkdown(p) {
    const m = p.meta;
    const res = analysis();
    let out = `# ${p.name}\n\n`;
    if (m.title) out += `**Title:** ${m.title}  \n`;
    if (m.thumb) out += `**Thumbnail:** ${m.thumb}  \n`;
    if (m.promise) out += `**Promise:** ${m.promise}  \n`;
    if (m.question) out += `**Main question:** ${m.question}  \n`;
    out += `**Estimated runtime:** ${res.runtimeLabel} at ${p.wpm} wpm · ${res.totalWords} words\n\n`;
    p.sections.forEach((s, i) => {
      const st = res.sectionStats[i];
      out += `## ${i + 1}. ${s.title}` + (st && st.start != null ? ` _(${fmt(st.start)})_` : "") + `\n\n`;
      out += (s.text || "_(empty)_").replace(/\[([^\]]*)\]/g, "\n> 🎬 $1\n") + "\n\n";
    });
    return out.replace(/\n{3,}/g, "\n\n");
  }
  function toNarration(p) {
    return p.sections.map((s) => A.stripVisualNotes(s.text || "").replace(/[ \t]+/g, " ").replace(/ +([.,!?])/g, "$1").trim()).filter(Boolean).join("\n\n");
  }

  // ------------------------------------------------------------------ WRITE
  const metaFields = [
    ["#metaName", (p) => p.name, (p, v) => { p.name = v; renderProjectSelect(); }],
    ["#metaTopic", (p) => p.meta.topic, (p, v) => (p.meta.topic = v)],
    ["#metaTarget", (p) => p.targetMin, (p, v) => { p.targetMin = Math.max(1, +v || 1); updateTimings(); }],
    ["#metaWpm", (p) => p.wpm, (p, v) => { p.wpm = Math.min(250, Math.max(60, +v || 150)); updateTimings(); }],
    ["#metaTitle", (p) => p.meta.title, (p, v) => (p.meta.title = v)],
    ["#metaThumb", (p) => p.meta.thumb, (p, v) => (p.meta.thumb = v)],
    ["#metaPromise", (p) => p.meta.promise, (p, v) => (p.meta.promise = v)],
    ["#metaQuestion", (p) => p.meta.question, (p, v) => (p.meta.question = v)],
  ];
  metaFields.forEach(([sel, , set]) => {
    $(sel).addEventListener("input", (e) => { set(cur(), e.target.value); touch(); });
  });
  function renderMeta() {
    const p = cur();
    metaFields.forEach(([sel, get]) => { $(sel).value = get(p) == null ? "" : get(p); });
  }

  $("#templateSelect").innerHTML = TEMPLATES.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
  $("#templateSelect").addEventListener("change", () => renderTemplateBar($("#templateSelect").value));
  $("#applyTemplateBtn").addEventListener("click", async () => {
    const p = cur();
    const tid = $("#templateSelect").value;
    const hasText = p.sections.some((s) => (s.text || "").trim());
    if (hasText && !(await askConfirm("Apply this structure? Your text is kept and moved into the new sections in order. Any extra text goes into the last section.", "Apply structure"))) return;
    const old = p.sections.map((s) => s.text).filter((t) => (t || "").trim());
    const fresh = sectionsFromTemplate(tid);
    old.forEach((t, i) => {
      const target = fresh[Math.min(i, fresh.length - 1)];
      target.text = target.text ? target.text + "\n\n" + t : t;
    });
    p.sections = fresh; p.templateId = tid; touch(); renderWrite();
    toast("Structure applied");
  });
  function renderTemplateBar(tid) {
    const t = TEMPLATES.find((x) => x.id === tid) || TEMPLATES[0];
    $("#templateSelect").value = t.id;
    $("#templateName").textContent = t.name;
    $("#templateBlurb").textContent = t.blurb;
  }

  function targetSeconds(p, i) {
    const total = p.sections.reduce((a, s) => a + (+s.pct || 0), 0) || 1;
    return ((+p.sections[i].pct || 0) / total) * p.targetMin * 60;
  }
  function sectionWords(s) { return A.words(A.stripVisualNotes(s.text || "")).length; }

  function renderSections() {
    const p = cur();
    const box = $("#sections");
    box.innerHTML = "";
    p.sections.forEach((s, i) => {
      const card = document.createElement("div");
      card.className = "card section-card";
      card.id = "sec-" + s.id;
      card.innerHTML = `
        <div class="section-head">
          <span class="num">${i + 1}</span>
          <input class="title" type="text" value="${esc(s.title)}" aria-label="Section title" />
          <button class="btn icon" data-act="up" title="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="btn icon" data-act="down" title="Move down" ${i === p.sections.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn icon" data-act="del" title="Delete section">✕</button>
        </div>
        ${s.purpose ? `<div class="section-purpose">${esc(s.purpose)}</div>` : ""}
        ${s.prompts && s.prompts.length ? `<details><summary>Writing prompts (${s.prompts.length})</summary><ul class="prompts">${s.prompts.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details>` : ""}
        <textarea placeholder="Write this section as you'd say it out loud…  [visual notes in brackets]">${esc(s.text)}</textarea>
        <div class="section-foot">
          <span class="stat"></span>
          <span class="bar"><i></i></span>
          <label class="inline" style="margin:0">share % <input class="pct" type="number" min="0" max="100" value="${+s.pct || 0}" style="width:64px;padding:3px 6px" /></label>
        </div>`;
      $(".title", card).addEventListener("input", (e) => { s.title = e.target.value; touch(); renderOutline(); });
      $("textarea", card).addEventListener("input", (e) => { s.text = e.target.value; touch(); updateTimings(); liveScore(); });
      $(".pct", card).addEventListener("input", (e) => { s.pct = Math.max(0, +e.target.value || 0); touch(); updateTimings(); });
      $$("[data-act]", card).forEach((b) => b.addEventListener("click", async () => {
        const act = b.dataset.act;
        if (act === "del") {
          if ((s.text || "").trim() && !(await askConfirm(`Delete section “${s.title}” and its text?`, "Delete section"))) return;
          p.sections.splice(i, 1);
          if (!p.sections.length) p.sections.push({ id: uid(), title: "Script", purpose: "", prompts: [], pct: 100, text: "" });
        } else {
          const j = act === "up" ? i - 1 : i + 1;
          [p.sections[i], p.sections[j]] = [p.sections[j], p.sections[i]];
        }
        touch(); renderWrite();
      }));
      box.appendChild(card);
    });
    updateTimings();
  }
  $("#addSectionBtn").addEventListener("click", () => {
    const p = cur();
    p.sections.push({ id: uid(), title: "New section", purpose: "", prompts: [], pct: 10, text: "" });
    touch(); renderWrite();
    const last = $$(".section-card").pop();
    if (last) { last.scrollIntoView({ behavior: "smooth", block: "center" }); $(".title", last).select(); }
  });

  function updateTimings() {
    const p = cur();
    $$(".section-card").forEach((card, i) => {
      const s = p.sections[i];
      if (!s) return;
      const w = sectionWords(s);
      const secs = (w / p.wpm) * 60;
      const tgt = targetSeconds(p, i);
      const ratio = tgt ? secs / tgt : 0;
      $(".stat", card).textContent = `${w} words · ${fmt(secs)} / target ${fmt(tgt)}`;
      const bar = $(".bar > i", card);
      bar.style.width = Math.min(100, ratio * 100) + "%";
      bar.classList.toggle("over", ratio > 1.25);
    });
    renderOutline();
  }
  function renderOutline() {
    const p = cur();
    let total = 0;
    let t = 0;
    $("#outline").innerHTML = p.sections.map((s, i) => {
      const secs = (sectionWords(s) / p.wpm) * 60;
      const tgt = targetSeconds(p, i);
      const start = t; t += secs; total += secs;
      const ratio = tgt ? secs / tgt : 0;
      return `<div class="outline-item" data-sec="${s.id}">
        <span class="t">${i + 1}. ${esc(s.title)}</span><span class="muted">${fmt(start)}</span>
        <span class="bar"><i class="${ratio > 1.25 ? "over" : ""}" style="width:${Math.min(100, ratio * 100)}%"></i></span>
      </div>`;
    }).join("");
    $$(".outline-item").forEach((el) => el.addEventListener("click", () => {
      const c = document.getElementById("sec-" + el.dataset.sec);
      if (c) { c.scrollIntoView({ behavior: "smooth", block: "start" }); $("textarea", c).focus({ preventScroll: true }); }
    }));
    const words = p.sections.reduce((a, s) => a + sectionWords(s), 0);
    const pct = Math.round((total / (p.targetMin * 60)) * 100);
    $("#totals").innerHTML = `<b>${fmt(total)}</b> of ${p.targetMin}:00 target · ${words} words · ${pct}%`;
  }

  function gradeClass(n) { return n >= 75 ? "g-good" : n >= 50 ? "g-warn" : "g-bad"; }
  const liveScore = debounce(() => {
    const r = analysis();
    if (r.empty) { $("#liveScore").innerHTML = `<p class="muted small">Start writing to see your score.</p>`; return; }
    const sc = r.scores;
    const rows = [["Hook", sc.hook], ["Momentum", sc.momentum], ["Clarity", sc.clarity], ["Engagement", sc.engagement]];
    const top = r.issues.find((x) => x.severity === "high") || r.issues[0];
    $("#liveScore").innerHTML = `
      <div class="score-mini">
        <div class="score-big ${gradeClass(sc.overall)}">${sc.overall}</div>
        <div class="subscores">${rows.map(([k, v]) => `<span>${k}</span><span class="bar"><i style="width:${v}%;background:var(--${v >= 75 ? "good" : v >= 50 ? "warn" : "bad"})"></i></span><span>${v}</span>`).join("")}</div>
      </div>
      ${top ? `<p class="small"><b>Top fix:</b> ${esc(top.title)}</p>` : `<p class="small good-news">No major issues found.</p>`}`;
  }, 400);

  function renderWrite() {
    const p = cur();
    renderMeta();
    renderTemplateBar(p.templateId);
    renderSections();
    liveScore();
  }

  // ------------------------------------------------------------------ ANALYZE
  function ring(value, label) {
    const r = 34, c = 2 * Math.PI * r;
    const col = value >= 75 ? "var(--good)" : value >= 50 ? "var(--warn)" : "var(--bad)";
    return `<div class="ring"><svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="${label} ${value}">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${(value / 100) * c} ${c}" transform="rotate(-90 42 42)"/>
      <text x="42" y="48" text-anchor="middle" font-size="20" font-weight="700" fill="currentColor">${value}</text></svg>
      <div class="lbl">${label}</div></div>`;
  }
  function segClass(s) {
    if (s.flags.includes("question")) return "q";
    if (s.flags.includes("turn")) return "turn";
    if (s.flags.includes("loop")) return "loop";
    if (s.flags.includes("example")) return "ex";
    if (s.flags.includes("long")) return "long";
    return "plain";
  }
  function renderAnalyze() {
    const gap = +$("#gapSelect").value;
    const r = analysis({ rehookGap: gap });
    if (r.empty) {
      $("#scoreRings").innerHTML = "";
      $("#metrics").innerHTML = `<p class="muted">Nothing to analyze yet — write some script in the Write tab (or open the demo script).</p>`;
      $("#timeline").innerHTML = ""; $("#issues").innerHTML = ""; $("#annotated").innerHTML = "";
      return;
    }
    const sc = r.scores;
    $("#scoreRings").innerHTML = ring(sc.overall, "Overall") + ring(sc.hook, "Hook") + ring(sc.momentum, "Momentum") + ring(sc.clarity, "Clarity") + ring(sc.engagement, "Engagement");
    const m = r.metrics;
    const met = [
      [r.runtimeLabel, `runtime @ ${r.wpm} wpm`], [r.totalWords, "spoken words"], [m.avgSentence, "avg words / sentence"],
      [m.readability, "readability (60+ ideal)"], [m.rehooks, "re-hooks"], [m.longestGap + "s", "longest gap w/o re-hook"],
      [m.questions, "questions"], [m.turns, "twists / “but”"], [m.therefores, "“therefore / so”"], [m.andThen, "“and then”"],
      [m.openLoops, "open loops"], [m.examples, "examples / analogies"], [m.youPer100, "“you” per 100 words"], [m.fillerCount, "filler words"],
    ];
    $("#metrics").innerHTML = met.map(([v, l]) => `<div class="metric"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");

    // Timeline
    const T = r.runtime || 1;
    const pct = (x) => (x / T) * 100;
    let html = "";
    r.gaps.forEach((g) => { html += `<div class="gap" style="left:${pct(g.from)}%;width:${pct(g.len)}%" title="${Math.round(g.len)}s without a re-hook"></div>`; });
    r.sentences.forEach((s, i) => {
      html += `<div class="seg ${segClass(s)}" data-i="${i}" style="left:${pct(s.start)}%;width:${Math.max(0.15, pct(s.duration))}%" title="${fmt(s.start)} — ${esc(s.text.slice(0, 120))}"></div>`;
      if (s.rehook) html += `<span class="mark" style="left:${pct(s.start)}%">▲</span>`;
    });
    r.sectionStats.forEach((st) => { if (st.start != null && st.start > 0) html += `<div class="secline" style="left:${pct(st.start)}%" title="${esc(st.title)}"></div>`; });
    const step = T > 1200 ? 300 : T > 600 ? 120 : T > 240 ? 60 : 30;
    for (let x = step; x < T; x += step) html += `<span class="tick" style="left:${pct(x)}%">${fmt(x)}</span>`;
    $("#timeline").innerHTML = html;
    $$("#timeline .seg").forEach((el) => el.addEventListener("click", () => flashSentence(+el.dataset.i)));

    // Issues
    $("#issues").innerHTML = r.issues.length ? r.issues.map((x) => {
      const idx = x.at == null ? -1 : nearestSentence(r, x.at);
      return `<div class="issue ${x.severity}">
        <div class="h"><span>${esc(x.title)}</span><span class="tag">${esc(x.area)} · ${x.severity}</span></div>
        <p>${esc(x.detail)}</p>${idx >= 0 ? `<button class="jump" data-i="${idx}">Show at ${fmt(r.sentences[idx].start)} →</button>` : ""}</div>`;
    }).join("") : `<p class="good-news">🎉 No issues detected. Read it aloud once more, then record!</p>`;
    $$("#issues .jump").forEach((b) => b.addEventListener("click", () => flashSentence(+b.dataset.i)));

    // Annotated
    let lastSec = -1;
    const p = cur();
    $("#annotated").innerHTML = r.sentences.map((s, i) => {
      let pre = "";
      if (s.section !== lastSec) { lastSec = s.section; pre = `<div class="sec-title">${esc(p.sections[s.section] ? p.sections[s.section].title : "")}</div>`; }
      const cls = ["s"];
      if (s.flags.includes("question")) cls.push("q");
      else if (s.flags.includes("turn")) cls.push("turn");
      else if (s.flags.includes("loop")) cls.push("loop");
      if (s.flags.includes("long")) cls.push("long");
      return `${pre}<span class="${cls.join(" ")}" id="sent-${i}" title="${s.flags.join(", ")}"><span class="ts">${fmt(s.start)}</span>${esc(s.text)}</span> `;
    }).join("");
  }
  function nearestSentence(r, at) {
    let best = 0;
    r.sentences.forEach((s, i) => { if (s.start <= at + 0.01) best = i; });
    return best;
  }
  function flashSentence(i) {
    const el = document.getElementById("sent-" + i);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1600);
  }
  $("#gapSelect").addEventListener("change", renderAnalyze);

  // ------------------------------------------------------------------ HOOKS
  let activeHook = HOOKS[0].id;
  const hookValues = {};
  function renderHookTypes() {
    $("#hookTypes").innerHTML = HOOKS.map((h) => `<button class="hook-type ${h.id === activeHook ? "active" : ""}" data-id="${h.id}"><b>${esc(h.name)}</b><span>${esc(h.bestFor)}</span></button>`).join("");
    $$("#hookTypes .hook-type").forEach((b) => b.addEventListener("click", () => { activeHook = b.dataset.id; renderHookTypes(); renderHookBuilder(); }));
  }
  function fillPattern(pat, vals, h) {
    return pat.replace(/\{(\w+)\}/g, (_, k) => (vals[k] && vals[k].trim()) ? vals[k].trim() : `[${h.labels[k] || k}]`)
      .replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase())
      .replace(/\.\./g, ".");
  }
  function renderHookBuilder() {
    const h = HOOKS.find((x) => x.id === activeHook);
    const vals = hookValues[h.id] = hookValues[h.id] || {};
    $("#hookBuilder").innerHTML = `
      <h3>${esc(h.name)}</h3>
      <p>${esc(h.why)}</p>
      <p class="muted small">Example: </p><div class="example">${esc(h.example)}</div>
      <h3 style="margin-top:14px">Fill in your story</h3>
      ${h.fields.map((f) => `<label>${esc(h.labels[f])}<input type="text" data-f="${f}" value="${esc(vals[f] || "")}" /></label>`).join("")}
      <h3>Variations</h3><div id="variants"></div>`;
    const draw = () => {
      $("#variants").innerHTML = h.patterns.map((pt, i) => {
        const txt = fillPattern(pt, vals, h);
        return `<div class="variant"><p>${esc(txt)}</p><span style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn small" data-copy="${i}">Copy</button><button class="btn small" data-use="${i}">Use as hook</button><button class="btn small" data-test="${i}">Test</button></span></div>`;
      }).join("");
      $$("#variants [data-copy]").forEach((b) => b.addEventListener("click", () => copy(fillPattern(h.patterns[+b.dataset.copy], vals, h))));
      $$("#variants [data-test]").forEach((b) => b.addEventListener("click", () => {
        $("#hookTest").value = fillPattern(h.patterns[+b.dataset.test], vals, h); renderHookTest();
      }));
      $$("#variants [data-use]").forEach((b) => b.addEventListener("click", () => {
        const txt = fillPattern(h.patterns[+b.dataset.use], vals, h);
        const p = cur();
        const first = p.sections[0];
        first.text = txt + (first.text ? "\n\n" + first.text : "");
        touch(); renderSections(); liveScore();
        toast("Added to the start of “" + first.title + "”");
      }));
    };
    $$("#hookBuilder [data-f]").forEach((inp) => inp.addEventListener("input", () => { vals[inp.dataset.f] = inp.value; draw(); }));
    draw();
  }
  function renderHookTest() {
    const text = $("#hookTest").value;
    const out = $("#hookTestResult");
    if (!text.trim()) { out.innerHTML = ""; return; }
    const wpm = cur().wpm;
    const w = A.words(A.stripVisualNotes(text)).length;
    const secs = (w / wpm) * 60;
    const lower = text.toLowerCase();
    const sentences = A.splitSentences(text);
    const firstLen = sentences.length ? A.words(sentences[0]).length : 0;
    const checks = [
      [secs <= 15, `Fits in ~15 seconds (${fmt(secs)}, ${w} words)`],
      [firstLen <= 15, `First sentence is punchy (${firstLen} words; ≤15 ideal)`],
      [/\?/.test(text) || /\b(but|turns out|until|nobody|secret|mystery|wrong|never|why)\b/i.test(text), "Creates a curiosity gap (question, twist or mystery)"],
      [/(\d|\b(million|billion|thousand|hundred|percent)\b)/i.test(text) || /\b(die|died|lost|risk|disaster|deadly|crash|broke)\b/i.test(text), "Has stakes or a specific, concrete number"],
      [/\b(you|your|you're)\b/i.test(text) || /\?/.test(text), "Involves the viewer ('you' or a direct question)"],
      [!/(hey guys|welcome back|my name is|in this video|in today's video|subscribe|before we (start|begin)|let's get started)/i.test(lower), "No preamble (greetings, 'in this video', subscribe asks)"],
      [!/^\s*(so|today|in this|hi|hello|hey)\b/i.test(text), "Doesn't start with a throwaway word (So / Today / Hi)"],
    ];
    const score = checks.filter((c) => c[0]).length;
    out.innerHTML = `<ul class="checks">${checks.map(([okk, l]) => `<li>${okk ? "✅" : "⚠️"} ${esc(l)}</li>`).join("")}</ul>
      <p><b class="${gradeClass((score / checks.length) * 100)}">${score}/${checks.length}</b> hook checks passed.</p>`;
  }
  $("#hookTest").addEventListener("input", debounce(renderHookTest, 150));

  // ------------------------------------------------------------------ STORY
  const TRANSITIONS = [
    "But that's not the strangest part.",
    "And that's where everything went wrong.",
    "Which raises an even bigger question…",
    "Here's the problem.",
    "There was just one thing nobody had noticed.",
    "So they tried something else. It made things worse.",
    "Hold on to that idea — it's going to matter in a minute.",
    "To understand why, we need to go back to…",
    "And this is the part most people get wrong.",
    "Now, you might be thinking… And you'd be partly right.",
    "That should have been the end of it. It wasn't.",
    "The answer turned out to be hiding in plain sight.",
    "Remember that number. We're coming back to it.",
    "But first, there's something you need to see.",
    "This is where it gets weird.",
    "Here's what that actually looks like.",
    "Which means one thing:",
    "So what changed?",
  ];
  function renderStory() {
    const p = cur();
    const st = p.story;
    $("#abtAnd").value = st.abt.and || "";
    $("#abtBut").value = st.abt.but || "";
    $("#abtTherefore").value = st.abt.therefore || "";
    drawAbt();
    renderBeats();
    const myth = st.myth || (st.myth = {});
    ["Belief", "Why", "Break", "Truth", "Analogy", "SoWhat"].forEach((k) => { $("#myth" + k).value = myth[k] || ""; });
    drawMyth();
  }
  const trimEnd = (s) => (s || "").trim().replace(/[.,;…]+$/, "");
  const trimStart = (s, words) => (s || "").trim().replace(new RegExp("^(" + words + ")\\b[,]?\\s*", "i"), "").replace(/^[.…,]+/, "");
  function drawAbt() {
    const a = cur().story.abt;
    if (!a.and && !a.but && !a.therefore) { $("#abtOut").textContent = ""; return; }
    const t = `${trimEnd(trimStart(a.and, "and"))}, but ${trimEnd(trimStart(a.but, "but"))}. Therefore, ${trimEnd(trimStart(a.therefore, "therefore"))}.`;
    $("#abtOut").textContent = t.charAt(0).toUpperCase() + t.slice(1);
  }
  [["#abtAnd", "and"], ["#abtBut", "but"], ["#abtTherefore", "therefore"]].forEach(([sel, k]) => {
    $(sel).addEventListener("input", (e) => { cur().story.abt[k] = e.target.value; touch(); drawAbt(); });
  });
  $("#abtToScript").addEventListener("click", () => {
    const t = $("#abtOut").textContent;
    if (!t) return toast("Fill in the ABT first");
    const s = cur().sections[0];
    s.text = (s.text ? s.text + "\n\n" : "") + t;
    touch(); renderSections(); liveScore(); toast("Inserted into “" + s.title + "”");
  });

  function renderBeats() {
    const p = cur();
    const beats = p.story.beats;
    $("#beats").innerHTML = beats.map((b, i) => `
      <div class="beat">
        <div class="beat-row"><input type="text" data-bi="${i}" value="${esc(b.text)}" placeholder="Beat ${i + 1}: what happens" />
          <button class="btn icon" data-bdel="${i}" title="Remove beat">✕</button></div>
        ${i < beats.length - 1 ? `<select class="connector ${b.conn === "and then" ? "bad" : ""}" data-bc="${i}">
          ${["but", "therefore", "and then"].map((c) => `<option ${c === b.conn ? "selected" : ""}>${c}</option>`).join("")}</select>` : ""}
      </div>`).join("");
    $$("#beats [data-bi]").forEach((inp) => inp.addEventListener("input", () => { beats[+inp.dataset.bi].text = inp.value; touch(); drawBeats(); }));
    $$("#beats [data-bc]").forEach((sel) => sel.addEventListener("change", () => { beats[+sel.dataset.bc].conn = sel.value; touch(); renderBeats(); }));
    $$("#beats [data-bdel]").forEach((b) => b.addEventListener("click", () => { beats.splice(+b.dataset.bdel, 1); touch(); renderBeats(); }));
    drawBeats();
  }
  function drawBeats() {
    const beats = cur().story.beats.filter((b) => b.text.trim());
    if (!beats.length) { $("#beatsOut").textContent = ""; return; }
    const chain = cur().story.beats.map((b, i, arr) => b.text.trim() ? b.text.trim() + (i < arr.length - 1 ? ` → ${b.conn.toUpperCase()} →` : "") : "").filter(Boolean).join("\n");
    const bad = cur().story.beats.slice(0, -1).filter((b) => b.conn === "and then").length;
    $("#beatsOut").textContent = chain + "\n\n" + (bad ? `⚠️ ${bad} “and then” link(s). Can each become a BUT (something goes wrong) or THEREFORE (a consequence)?` : "✅ Every beat is causally linked. That's a story, not a list.");
  }
  $("#addBeat").addEventListener("click", () => { cur().story.beats.push({ text: "", conn: "therefore" }); touch(); renderBeats(); });

  ["Belief", "Why", "Break", "Truth", "Analogy", "SoWhat"].forEach((k) => {
    $("#myth" + k).addEventListener("input", (e) => { cur().story.myth[k] = e.target.value; touch(); drawMyth(); });
  });
  function mythLines() {
    const m = cur().story.myth || {};
    const L = [];
    if (m.Belief) L.push(["The Misconception", `Most people believe ${trimEnd(m.Belief)}.` + (m.Why ? ` And honestly, it makes sense: ${trimEnd(m.Why)}.` : "")]);
    if (m.Break) L.push(["The Evidence That Breaks It", `But here's the problem: ${trimEnd(m.Break)}.`]);
    if (m.Truth) L.push(["The Real Model", `So what's actually going on? ${trimEnd(m.Truth)}.` + (m.Analogy ? ` Think of it like this: ${trimEnd(m.Analogy)}.` : "")]);
    if (m.SoWhat) L.push(["So What?", `Why does this matter to you? ${trimEnd(m.SoWhat)}.`]);
    return L;
  }
  function drawMyth() {
    $("#mythOut").textContent = mythLines().map(([h, t]) => `▸ ${h}\n${t}`).join("\n\n");
  }
  $("#mythToScript").addEventListener("click", () => {
    const L = mythLines();
    if (!L.length) return toast("Fill in the planner first");
    const p = cur();
    L.forEach(([h, t]) => p.sections.push({ id: uid(), title: h, purpose: "From the Misconception Planner — expand this into full narration.", prompts: [], pct: 10, text: t }));
    touch(); renderSections(); liveScore(); toast(L.length + " sections added to the end of your script");
  });

  $("#transitions").innerHTML = TRANSITIONS.map((t) => `<button class="chip">${esc(t)}</button>`).join("");
  $$("#transitions .chip").forEach((c) => c.addEventListener("click", () => copy(c.textContent)));

  // ------------------------------------------------------------------ PLAYBOOK
  function renderPlaybook() {
    $("#playbook").innerHTML = PLAYBOOK.map((th) => `
      <div class="theme"><h2>${esc(th.theme)}</h2>
      ${th.items.map((it) => `<div class="principle"><b>${esc(it.t)}</b><p>${esc(it.d)}</p>
        <div class="refs">${it.src.map((s) => SOURCES[s] ? `<a href="${SOURCES[s].url}" target="_blank" rel="noopener">↗ ${esc(SOURCES[s].name.split("—")[0].trim())}</a>` : "").join("")}</div></div>`).join("")}
      </div>`).join("");
    $("#sources").innerHTML = Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("");
  }
  function renderChecklist() {
    const p = cur();
    $("#checklist").innerHTML = CHECKLIST.map((c, i) => `<label class="check-item"><input type="checkbox" data-ci="${i}" ${p.checklist[i] ? "checked" : ""}/> <span>${esc(c)}</span></label>`).join("");
    const upd = () => { const n = CHECKLIST.filter((_, i) => p.checklist[i]).length; $("#checklistScore").textContent = `${n} / ${CHECKLIST.length} done`; };
    $$("#checklist [data-ci]").forEach((cb) => cb.addEventListener("change", () => { p.checklist[cb.dataset.ci] = cb.checked; touch(); upd(); }));
    upd();
  }

  // ------------------------------------------------------------------ TELEPROMPTER
  let tpRunning = false, tpLast = 0, tpPos = 0;
  function openPrompter() {
    const p = cur();
    const showNotes = $("#tpNotes").checked;
    $("#tpText").innerHTML = p.sections.map((s) => {
      const body = esc(s.text || "").replace(/\[([^\]]*)\]/g, showNotes ? '<span class="vn">🎬 $1</span>' : "").replace(/\n+/g, "<br/><br/>");
      return body.trim() ? `<h4>${esc(s.title)}</h4>${body}` : "";
    }).join("");
    $("#tpText").style.fontSize = $("#tpSize").value + "px";
    $("#tpText").classList.toggle("mirror", $("#tpMirror").checked);
    $("#prompter").hidden = false;
    $("#tpView").scrollTop = 0; tpPos = 0;
    $("#tpTime").textContent = "≈ " + analysis().runtimeLabel + " read time";
    try { if (navigator.wakeLock && !tpWake) navigator.wakeLock.request("screen").then((w) => (tpWake = w), () => {}); } catch (e) { /* optional */ }
  }
  let tpWake = null;
  function closePrompter() { if (tpWake) { tpWake.release().catch(() => {}); tpWake = null; } tpRunning = false; $("#tpPlay").textContent = "▶ Play"; $("#prompter").hidden = true; }
  function tpLoop(ts) {
    if (!tpRunning) return;
    const dt = tpLast ? (ts - tpLast) / 1000 : 0;
    tpLast = ts;
    const v = $("#tpView");
    tpPos += (+$("#tpSpeed").value) * dt;
    v.scrollTop = tpPos;
    if (v.scrollTop + v.clientHeight >= v.scrollHeight - 2) { tpRunning = false; $("#tpPlay").textContent = "▶ Play"; return; }
    requestAnimationFrame(tpLoop);
  }
  function tpToggle() {
    tpRunning = !tpRunning;
    $("#tpPlay").textContent = tpRunning ? "❚❚ Pause" : "▶ Play";
    if (tpRunning) { tpLast = 0; tpPos = $("#tpView").scrollTop; requestAnimationFrame(tpLoop); }
  }
  $("#teleprompterBtn").addEventListener("click", openPrompter);
  $("#tpClose").addEventListener("click", closePrompter);
  $("#tpPlay").addEventListener("click", tpToggle);
  $("#tpSize").addEventListener("input", (e) => ($("#tpText").style.fontSize = e.target.value + "px"));
  $("#tpMirror").addEventListener("change", (e) => $("#tpText").classList.toggle("mirror", e.target.checked));
  $("#tpNotes").addEventListener("change", () => { const pos = $("#tpView").scrollTop; openPrompter(); $("#tpView").scrollTop = pos; tpPos = pos; });
  $("#tpView").addEventListener("wheel", () => { tpPos = $("#tpView").scrollTop; }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if ($("#prompter").hidden) return;
    if (e.key === "Escape") closePrompter();
    if (e.key === " ") { e.preventDefault(); tpToggle(); }
  });

  // ------------------------------------------------------------------ SCRIPT DOCTOR
  const { STYLES } = window.KB;
  const R = window.Rewrite;
  const EXAMPLE_DRAFT = "Hey guys, welcome back to the channel! In this video we're going to talk about honey. Honey is basically a really interesting food. Archaeologists found honey in Egyptian tombs and it was still edible.\n\nHoney has very low water content and it is acidic. And then bees also add an enzyme which makes hydrogen peroxide. And then that is why bacteria can't grow in it. Also honey is very sweet because it is mostly sugar, so microbes basically dry out when they touch it.\n\nSo that's basically why honey doesn't go bad. Don't forget to like and subscribe, thanks for watching!";
  // The page can ask Claude only inside a Claude viewer; elsewhere this resolves null.
  const sampleReady = (window.claude && typeof window.claude.use === "function")
    ? window.claude.use("sample").catch(() => null)
    : Promise.resolve(null);
  let sampleFn = null;
  let docCtl = null;
  sampleReady.then((fn) => { sampleFn = fn; });

  function doc() {
    if (!state.doctor) {
      state.doctor = { topic: "Why honey never spoils", audience: "", minutes: 6, wpm: 150, style: "auto", template: "auto", text: EXAMPLE_DRAFT, isExample: true, result: null };
    }
    return state.doctor;
  }
  $("#docStyle").innerHTML = STYLES.map((s) => `<option value="${s.id}">${esc(s.name)} · ${esc(s.inspired)}</option>`).join("");
  $("#docTemplate").innerHTML = `<option value="auto">Auto (match the writer style)</option>` + TEMPLATES.filter((t) => t.id !== "blank").map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("");

  function docInputs() {
    const d = doc();
    $("#docTopic").value = d.topic || "";
    $("#docAudience").value = d.audience || "";
    $("#docMinutes").value = d.minutes;
    $("#docWpm").value = d.wpm;
    $("#docStyle").value = d.style;
    $("#docTemplate").value = d.template;
    $("#docText").value = d.text || "";
    $("#docExampleNote").hidden = !d.isExample;
    docStyleInfo();
  }
  function docStyleInfo() {
    const st = STYLES.find((s) => s.id === $("#docStyle").value) || STYLES[0];
    $("#docStyleInfo").textContent = st.summary;
  }
  [["#docTopic", "topic"], ["#docAudience", "audience"]].forEach(([sel, k]) =>
    $(sel).addEventListener("input", (e) => { doc()[k] = e.target.value; persist(); }));
  $("#docMinutes").addEventListener("input", (e) => { doc().minutes = Math.min(60, Math.max(1, +e.target.value || 6)); persist(); });
  $("#docWpm").addEventListener("input", (e) => { doc().wpm = Math.min(220, Math.max(80, +e.target.value || 150)); persist(); docReport(); });
  $("#docStyle").addEventListener("change", (e) => { doc().style = e.target.value; persist(); docStyleInfo(); });
  $("#docTemplate").addEventListener("change", (e) => { doc().template = e.target.value; persist(); });
  $("#docText").addEventListener("input", (e) => {
    const d = doc();
    d.text = e.target.value;
    if (d.isExample) { d.isExample = false; $("#docExampleNote").hidden = true; }
    persist(); docReportDebounced();
  });

  function docAnalysis() { const d = doc(); return A.analyze(d.text || "", { wpm: d.wpm }); }

  function docReport() {
    const r = docAnalysis();
    const box = $("#docReport");
    if (r.empty) { box.innerHTML = `<p class="muted">Paste a script to see its retention check.</p>`; return; }
    const sc = r.scores, m = r.metrics;
    box.innerHTML = `
      <div class="mini-rings">${ring(sc.overall, "Overall") + ring(sc.hook, "Hook") + ring(sc.momentum, "Momentum") + ring(sc.clarity, "Clarity") + ring(sc.engagement, "Engagement")}</div>
      <div class="mini-metrics">
        <span><b>${r.runtimeLabel}</b> runtime</span><span><b>${r.totalWords}</b> words</span>
        <span><b>${m.rehooks}</b> re-hooks</span><span><b>${m.longestGap}s</b> longest gap</span>
        <span><b>${m.questions}</b> questions</span><span><b>${m.andThen}</b> “and then”</span>
        <span><b>${m.examples}</b> examples</span><span><b>${m.readability}</b> readability</span>
      </div>
      ${r.issues.length ? r.issues.map((x) => `<div class="issue ${x.severity}"><div class="h"><span>${esc(x.title)}</span><span class="tag">${esc(x.area)} · ${x.severity}</span></div><p>${esc(x.detail)}</p></div>`).join("")
        : `<p class="good-news">No major issues found. The rewrite can still sharpen the story and structure.</p>`}`;
  }
  const docReportDebounced = debounce(docReport, 300);

  function docPrompt() {
    const d = doc();
    return R.buildPrompt({ text: d.text, topic: d.topic, audience: d.audience, minutes: d.minutes, wpm: d.wpm, styleId: d.style, templateId: d.template, analysis: docAnalysis() });
  }

  function scriptHtml(sections, streaming) {
    if (!sections.length) return `<p class="streaming">${streaming ? "Thinking… a full script usually takes 30–90 seconds." : ""}</p>`;
    return sections.map((s) => `<h4>${esc(s.title)}</h4>` + s.text.split(/\n{2,}/).map((para) =>
      `<p>${esc(para)
        .replace(/\[CHECK:([^\]]*)\]/g, '<span class="chk">⚠ Check:$1</span>')
        .replace(/\[([^\]]*)\]/g, '<span class="vn">[$1]</span>')
        .replace(/\n/g, "<br/>")}</p>`).join("")).join("");
  }

  function renderDocResult(raw, streaming) {
    const card = $("#docResultCard");
    card.hidden = false;
    const p = R.parse(raw || "");
    $("#docScript").innerHTML = scriptHtml(p.sections, streaming);
    $("#docPackaging").innerHTML =
      (p.titles.length ? `<h4>Title options</h4><ol>${p.titles.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` : "") +
      (p.thumbnail ? `<h4>Thumbnail idea</h4><ul><li>${esc(p.thumbnail)}</li></ul>` : "");
    $("#docChanges").innerHTML = p.changes.length ? `<h4>What changed</h4><ul>${p.changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : "";
    const checks = (raw || "").match(/\[CHECK:/g);
    if (!streaming && checks) $("#docChanges").innerHTML += `<p class="notice">⚠ ${checks.length} fact(s) are marked “Check”. Verify them before you record.</p>`;
    const busy = !!streaming;
    ["#docOpen", "#docCopy", "#docAgain"].forEach((sel) => ($(sel).disabled = busy || !p.sections.length));
    if (!streaming && p.sections.length) {
      const before = docAnalysis();
      const d = doc();
      const after = A.analyze(p.sections, { wpm: d.wpm });
      const rows = [["Overall", "overall"], ["Hook", "hook"], ["Momentum", "momentum"], ["Clarity", "clarity"], ["Engagement", "engagement"]];
      $("#docCompare").innerHTML = rows.map(([l, k]) => {
        const diff = after.scores[k] - (before.empty ? 0 : before.scores[k]);
        return `<div class="cmp">${l}: ${before.empty ? "–" : before.scores[k]} → <b class="${gradeClass(after.scores[k])}">${after.scores[k]}</b> ${diff ? `<span class="${diff > 0 ? "up" : "down"}">${diff > 0 ? "+" : ""}${diff}</span>` : ""}</div>`;
      }).join("") + `<div class="cmp">Runtime: <b>${after.runtimeLabel}</b> · ${after.totalWords} words</div>`;
    } else {
      $("#docCompare").innerHTML = "";
    }
  }

  const ERR = {
    not_granted: "Claude wasn't allowed for this page. Use “Copy rewrite prompt” and paste it into a Claude chat instead.",
    sampling_disabled: "Claude isn't available for this account here. Use “Copy rewrite prompt” and paste it into a Claude chat instead.",
    rate_limited: "You've hit a usage limit for now. Wait a bit, then try again.",
    session_expired: "Your Claude session expired. Sign in again, then try again.",
    prompt_too_large: "That draft is too long to rewrite in one go. Paste one part at a time.",
    refused: "Claude declined this draft. Try rewording it.",
    empty_completion: "Claude returned nothing. Try again, perhaps with a shorter draft.",
  };

  async function docWrite(fresh) {
    const d = doc();
    if (!(d.text || "").trim()) { toast("Paste a script or notes first"); return; }
    const fn = sampleFn || (await sampleReady);
    if (!fn) {
      $("#docStatus").innerHTML = "Writing the finished version needs Claude. That works when you open this app from its claude.ai link. Here, click <b>Copy rewrite prompt</b> and paste it into a Claude chat. It contains all the rules and your draft.";
      return;
    }
    docCtl = new AbortController();
    $("#docWrite").disabled = true;
    $("#docStop").hidden = false;
    $("#docStatus").textContent = "Writing your finished script…";
    renderDocResult("", true);
    $("#docResultCard").scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const opts = { signal: docCtl.signal, onText: ({ text }) => renderDocResult(text, true) };
      if (fresh) opts.cache = false;
      const { text, truncated } = await fn(docPrompt(), opts);
      d.result = text; persist();
      renderDocResult(text, false);
      $("#docStatus").textContent = truncated ? "The answer was cut short. Try a shorter target length." : "Done. Review it, then open it in the editor to polish and record.";
    } catch (e) {
      if (e && e.text) { d.result = e.text; renderDocResult(e.text, false); }
      else if (!d.result) $("#docResultCard").hidden = true;
      else renderDocResult(d.result, false);
      $("#docStatus").textContent = e && e.code === "cancelled" ? "Stopped." : (ERR[e && e.code] || "Something went wrong while writing. Try again.");
    } finally {
      $("#docWrite").disabled = false;
      $("#docStop").hidden = true;
      docCtl = null;
    }
  }
  $("#docWrite").addEventListener("click", () => docWrite(false));
  $("#docAgain").addEventListener("click", () => docWrite(true));
  $("#docStop").addEventListener("click", () => docCtl && docCtl.abort());
  $("#docCopyPrompt").addEventListener("click", () => {
    if (!(doc().text || "").trim()) { toast("Paste a script or notes first"); return; }
    copy(docPrompt());
  });
  $("#docCopy").addEventListener("click", () => {
    const p = R.parse(doc().result || "");
    copy(p.sections.map((s) => "## " + s.title + "\n\n" + s.text).join("\n\n"));
  });
  $("#docOpen").addEventListener("click", () => {
    const d = doc();
    const p = R.parse(d.result || "");
    if (!p.sections.length) return;
    const st = STYLES.find((s) => s.id === d.style) || STYLES[0];
    const tid = d.template === "auto" ? st.template : d.template;
    const proj = newProject(tid, (d.topic || p.titles[0] || "Finished script").slice(0, 80));
    proj.targetMin = d.minutes; proj.wpm = d.wpm;
    proj.meta = { topic: d.topic || "", title: p.titles[0] || "", thumb: p.thumbnail || "", promise: "", question: "" };
    const total = p.sections.reduce((a, s) => a + A.words(A.stripVisualNotes(s.text)).length, 0) || 1;
    proj.sections = p.sections.map((s) => ({
      id: uid(), title: s.title, purpose: "", prompts: [], text: s.text,
      pct: Math.max(1, Math.round((A.words(A.stripVisualNotes(s.text)).length / total) * 100)),
    }));
    state.projects.push(proj); state.currentId = proj.id; persist();
    renderAll(); showTab("write");
    toast("Opened as a new script");
  });

  function renderDoctor() {
    docInputs();
    docReport();
    if (doc().result) renderDocResult(doc().result, false);
  }

  // ------------------------------------------------------------------ boot
  function renderAll() {
    renderProjectSelect();
    renderWrite();
    const active = $(".tabs button.active").dataset.tab;
    if (active === "analyze") renderAnalyze();
    if (active === "story") renderStory();
    if (active === "playbook") renderChecklist();
  }
  renderDoctor();
  renderHookTypes();
  renderHookBuilder();
  renderPlaybook();
  renderAll();
})();
