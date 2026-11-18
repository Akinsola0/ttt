# ✦ ScriptCraft

A script-writing studio for YouTube videos that **teach and tell a story at the same time**. It includes the structures, hooks and retention habits used by top educational and storytelling channels, plus a retention analyzer that scores your draft as you write.

No install and no internet needed. Open `index.html` in any browser. Your scripts are saved in your browser's local storage, so use **Export → Backup (.json)** to keep a copy or move to another device.

## What's inside

| Tab | What it does |
|---|---|
| **🩺 Script Doctor** | Paste any draft, notes or outline. You get an instant retention diagnosis (hook, momentum, clarity, engagement, with fixes). Then **Write finished version** rewrites it into a ready-to-record script using the rules, a structure template and a writer style. You also get title and thumbnail ideas, before/after scores, a list of what changed, and facts flagged for checking. Open the result in the editor with one click. Writing needs Claude: it works when the app is opened from its claude.ai link. Opened as a local file, use **Copy rewrite prompt** and paste it into a Claude chat. |
| **＋ Add facts & details** | Under every finished version (Script Doctor) and under any script in the Write tab. To skip the rewrite, paste your script and click **Keep my script & add facts**: your script is saved word for word as v1 and only your additions are woven in. **Copy script** returns it in its original layout. List facts (with sources), terms to define, details or quotes, with an optional placement hint. Claude decides only *where* each one belongs and writes the new sentence. The app inserts it, so no existing sentence is ever reworded, and it confirms this with a "✓ Original text unchanged" check. New text is highlighted, a list shows where each addition went and why, conflicting or unplaceable additions are refused with a reason, and new facts go into "Sources to check". Every round is saved as a new version, so you can compare, switch back or restore. |
| **🎯 Niche** | Pick your YouTube niche from the top bar: Spy & Declassified, True Crime, History, Science, Space, Business, Geopolitics, Mysteries, Psychology or General. Each niche has its audience, rules, hook and re-hook lines, pitfalls, title and thumbnail patterns, research archives and its own checks. The niche sets the Script Doctor's default style, structure and pace, adds its checks to every diagnosis, and feeds its rules into the rewrite. |
| **✍️ Write** | Section-by-section editor driven by a structure template. Each section has a purpose, writing prompts, a word count and a time target. Also includes a packaging panel (title, thumbnail, promise, main question), an outline with timings and a live retention score. Put visual / B-roll notes in `[brackets]`: they're kept in exports but not counted as spoken words. |
| **📈 Retention Analyzer** | Scores Hook, Momentum, Clarity and Engagement. Shows a sentence-by-sentence **retention timeline** with re-hook markers and red bands where the viewer goes too long without a new question or twist. Lists fixes in priority order and shows an annotated script. |
| **🪝 Hook Lab** | 8 hook types (cold open, misconception, curiosity question, stakes, shocking number, result preview, confession, "imagine"). Each one explains why it works, gives an example and a fill-in generator, and lets you insert a hook into your script with one click. Also has a **hook tester** that scores any opening against the first-15-seconds rules. |
| **🧭 Story Tools** | **ABT builder** (And / But / Therefore), **Beat Chain** (flags "and then" links), **Misconception Planner** (turns a myth into script sections) and a bank of re-hook / transition lines. |
| **📚 Playbook** | 30 research-backed principles in six themes, each linked to its source, plus a per-script pre-flight checklist. |
| **▶ Teleprompter** | Full-screen scrolling prompter with adjustable speed and size, mirror mode and optional visual notes. Space = play/pause, Esc = close. |

### Writer styles (Script Doctor)
These styles describe techniques drawn from interviews and breakdowns. They don't imitate anyone's voice.
- **Curious Investigator** (Veritasium-style): misconception first, questions before answers, A-plot/B-plot.
- **Detective Documentary** (Johnny Harris-style): first-person investigation, strange visual opener, show then ask.
- **Engineer's Thriller** (Mark Rober-style): focus on the feeling, hide the vegetables, failures as BUT beats, set up a rhythm and break it.
- **Big-Picture Explainer** (Kurzgesagt-style): visceral stakes, scale comparisons, hopeful zoom-out.
- **Straight-to-the-Problem Analyst** (Wendover-style): inverted pyramid, data and trade-offs.
- **One-Take Storyteller** (Tom Scott-style): dense, precise, anchored to a real place or object.
- **High-Energy Stakes** (MrBeast-guide style): escalation every 60–90 s, constant re-hooks.

### Structure templates
1. **Educational Story (Misconception-first).** The best all-rounder for teaching plus storytelling.
2. **Detective Mystery Explainer.** The viewer investigates alongside you.
3. **Documentary / Character Story.** A person wants something, faces obstacles and changes.
4. **Escalating List / Countdown.** Tease #1, then escalate with re-hooks between items.
5. **Teaching Tutorial.** Result first, common mistakes, step framework.
6. **Blank.**

## The research, distilled

**Hook & first minute**
- Most viewers leave in the first minute, so it gets the most writing effort. Minutes 1–3 and 3–6 come next. *(MrBeast production guide)*
- Hook within 5–15 s: confirm the viewer is in the right place, promise value, and open a loop you don't close yet.
- No greetings, channel intros or subscribe asks before the hook. Deliver on the title and thumbnail promise within 30 s. *(Paddy Galloway: packaging drives views)*

**Structure & momentum**
- Connect beats with **BUT** or **THEREFORE**, never **AND THEN**. *(Trey Parker & Matt Stone)*
- **And, But, Therefore (ABT)**: get out of "the land of And" (piling up facts with no tension). *(Randy Olson, science communication)*
- Re-hook every 60–90 s with a question, twist, stakes escalation or format change. Escalate stakes through the video.
- Open loops early and close **every** one. Leaving loops unresolved destroys trust.

**Teaching so it sticks**
- **Name the misconception first.** Derek Muller's (Veritasium) PhD research found that clear, polished explanations made viewers more confident but not more correct. Addressing the misconception made them think harder and learn more.
- Ask questions before you give answers. Curiosity (Loewenstein's information gap) is linked to better memory, especially when the answer feels knowable.
- Show evidence and investigate with the viewer instead of lecturing *(Johnny Harris style)*. Prefer concrete, visceral examples over abstract ones *(Kurzgesagt analysis)*.

**Writing for the ear**
- Write how you talk, one idea per sentence, and vary sentence length. Conversational narration runs at about 130–160 wpm.
- Talk to "you". Cut filler words. End on the payoff and a callback, not on "so that's it".

The full source list is in the Playbook tab and in `js/knowledge.js`.

> **Note on the analyzer:** the scores are heuristics built from this research (pattern detection for questions, twists, loops, sentence length and so on). Use them as a coach. Your real YouTube Studio retention graph is the final word.

## Development

```
npm test        # analyzer unit tests (Node 18+)
npm start       # optional: serve on http://localhost:8080
```

Files: `index.html`, `css/styles.css`, `js/knowledge.js` (templates, hooks, writer styles, playbook, sources), `js/niches.js` (niche profiles, spy thriller structure and style, niche checks), `js/rewrite.js` (rewrite prompt builder and answer parser), `js/enrich.js` (add-details placement, insertion and verification), `js/analyzer.js` (pure retention analysis that runs in the browser and in Node), `js/app.js` (UI).
