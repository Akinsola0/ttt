/*
 * ScriptCraft knowledge base.
 * Distilled from research into YouTube retention practice and storytelling /
 * science-communication literature. See the "sources" list at the bottom.
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Structure templates. `pct` = suggested share of total runtime.
  // ---------------------------------------------------------------------------
  const TEMPLATES = [
    {
      id: "edu-story",
      name: "Educational Story (Misconception-first)",
      blurb:
        "Best all-rounder for 'teach + entertain'. Opens on a surprise, names what people wrongly believe, then investigates its way to the truth. Based on the misconception-first approach from Derek Muller's physics-education research.",
      sections: [
        {
          title: "Cold Open / Hook",
          pct: 3,
          purpose: "Stop the scroll. Drop the viewer into the most intriguing moment, claim or image. No greetings, no 'in this video'.",
          prompts: [
            "What is the single most surprising fact, image or moment in this whole story?",
            "Can you open mid-action, at the moment something goes wrong or gets weird?",
            "What question will the viewer NEED answered after hearing these first lines?",
          ],
        },
        {
          title: "Stakes & Promise",
          pct: 5,
          purpose: "Tell the viewer why this matters to THEM and what they'll walk away with. Open the main loop you'll close at the end.",
          prompts: [
            "Why should someone who has never cared about this topic care now?",
            "What will the viewer understand by the end that they don't now?",
            "Confirm the title/thumbnail promise within the first 30 seconds.",
          ],
        },
        {
          title: "The Misconception",
          pct: 8,
          purpose: "State what most people believe — and why it's a perfectly reasonable thing to believe. Viewers who hold it lean in.",
          prompts: [
            "What's the intuitive-but-wrong answer most people would give?",
            "Why does that answer feel right? Steelman it.",
            "Optionally: ask the viewer to commit to an answer before you continue.",
          ],
        },
        {
          title: "Context (minimum viable background)",
          pct: 9,
          purpose: "Only the background the viewer needs for the next part. Deliver it as story (people, places, dates) not as a lecture.",
          prompts: [
            "Which ONE piece of background is truly required to follow the rest?",
            "Who is the person at the centre of this? What did they want?",
            "Cut any context that isn't paid off later.",
          ],
        },
        {
          title: "Investigation — Beat 1",
          pct: 14,
          purpose: "First piece of evidence or first attempt. End the beat with a BUT (complication) to roll into the next.",
          prompts: [
            "What's the first clue / experiment / event?",
            "What does it seem to prove — and BUT what doesn't fit?",
            "Re-hook: plant a question that the next beat answers.",
          ],
        },
        {
          title: "Investigation — Beat 2 (escalation)",
          pct: 14,
          purpose: "Raise the stakes or deepen the mystery. THEREFORE something new is tried; BUT it creates a bigger problem.",
          prompts: [
            "How do the stakes get higher than in beat 1?",
            "Add a concrete example, demo or analogy here.",
            "End with a twist, a reversal or a cliffhanger line.",
          ],
        },
        {
          title: "The Turn / Reveal",
          pct: 12,
          purpose: "The 'aha'. Answer the main question you opened in the hook. This is the emotional and intellectual peak.",
          prompts: [
            "What is the moment everything clicks?",
            "Can you SHOW it (visual, demo) rather than tell it?",
            "Say it in one sentence a 12-year-old would understand.",
          ],
        },
        {
          title: "Explain the Real Model",
          pct: 15,
          purpose: "Now teach properly. Correct the misconception explicitly, contrast old vs new mental model, use an analogy and a worked example.",
          prompts: [
            "Contrast: 'Most people think X. Actually Y, because Z.'",
            "Which everyday analogy makes this intuitive?",
            "Give one concrete, specific worked example with real numbers.",
          ],
        },
        {
          title: "So What? (Implications)",
          pct: 12,
          purpose: "Zoom out. Why does this change how the viewer sees the world, their money, their health, history…?",
          prompts: [
            "What's the bigger, surprising consequence of this idea?",
            "Where else does this show up in everyday life?",
            "What's the emotional takeaway, not just the factual one?",
          ],
        },
        {
          title: "Ending & Callback",
          pct: 8,
          purpose: "Close the loop on the opening image or question. End strong, then point to the next video while energy is high. No 'that's it, bye'.",
          prompts: [
            "How can the last line echo the first line with new meaning?",
            "One-sentence summary of the big idea.",
            "Natural bridge to a related video (not a generic 'like & subscribe').",
          ],
        },
      ],
    },
    {
      id: "detective",
      name: "Detective Mystery Explainer",
      blurb:
        "The viewer is the investigator. You show evidence and ask questions instead of lecturing. Great for history, geopolitics, 'why does X exist' topics.",
      sections: [
        { title: "The Strange Image", pct: 4, purpose: "Open on a weird object, map, photo or fact that doesn't make sense.", prompts: ["What looks wrong, unexplained or suspicious?", "Describe it so the viewer can SEE it."] },
        { title: "The Central Question", pct: 5, purpose: "Pose the mystery explicitly. This is the loop the whole video closes.", prompts: ["Phrase the mystery as a single question.", "Why hasn't the obvious answer solved it?"] },
        { title: "Clue #1", pct: 13, purpose: "First piece of evidence. It suggests an answer…", prompts: ["What does the first clue suggest?", "Where/when did you find it? (Ground it in a place.)"] },
        { title: "Clue #2 — Complication", pct: 14, purpose: "…BUT the second clue contradicts it. Tension rises.", prompts: ["What contradicts the first theory?", "Which new question does this raise?"] },
        { title: "The False Answer / Dead End", pct: 12, purpose: "Present the popular explanation — and show why it fails.", prompts: ["What do most articles/people say?", "What specifically breaks it?"] },
        { title: "The Breakthrough Clue", pct: 14, purpose: "The piece of evidence that unlocks it.", prompts: ["What did you find that changes everything?", "Build suspense right before revealing it."] },
        { title: "The Answer", pct: 14, purpose: "Solve the mystery clearly and completely.", prompts: ["Explain cause → effect step by step.", "Tie every earlier clue to the answer."] },
        { title: "What It Means Today", pct: 14, purpose: "Why the answer matters now.", prompts: ["How does this affect the viewer's world today?"] },
        { title: "Closing Callback", pct: 10, purpose: "Return to the strange image — now it makes perfect sense.", prompts: ["Re-show the opening image with its new meaning.", "Final line that lands."] },
      ],
    },
    {
      id: "character",
      name: "Documentary / Character Story",
      blurb:
        "A real person wants something, faces obstacles, and changes. Teach the lesson through their journey. Ideal for biographies, business stories, historical events.",
      sections: [
        { title: "Cold Open at the Crisis", pct: 5, purpose: "Start at the most dramatic moment, then rewind.", prompts: ["What is the moment everything was on the line?", "End the cold open on an unresolved cliffhanger."] },
        { title: "Who They Were", pct: 8, purpose: "Make the viewer care. Relatable details, flaws, ordinary life.", prompts: ["One vivid, specific detail that humanises them.", "What makes them like the viewer?"] },
        { title: "What They Wanted", pct: 8, purpose: "A clear desire gives the story direction.", prompts: ["What did they want, and why so badly?"] },
        { title: "The First Obstacle", pct: 12, purpose: "BUT something stood in the way.", prompts: ["What blocked them?", "Teach a concept here through the obstacle."] },
        { title: "Escalation", pct: 16, purpose: "THEREFORE they act — BUT things get worse. Repeat.", prompts: ["What did they try and what did it cost?", "Raise the stakes: money, time, reputation, life."] },
        { title: "The Darkest Moment", pct: 12, purpose: "All seems lost. Maximum tension.", prompts: ["What was the lowest point?", "Slow down the pacing here."] },
        { title: "The Turning Point", pct: 13, purpose: "A decision, discovery or insight changes everything.", prompts: ["What did they realise or decide?", "This insight is often the lesson of the video."] },
        { title: "Resolution", pct: 14, purpose: "How it ended — and back to the cold open moment.", prompts: ["Return to the cold-open scene; now we understand it."] },
        { title: "The Lesson", pct: 12, purpose: "What the viewer should take from this story.", prompts: ["One takeaway the viewer can use in their own life."] },
      ],
    },
    {
      id: "countdown",
      name: "Escalating List / Countdown",
      blurb:
        "A list where every item is better than the last, with a tease of the #1 item up front. Re-hooks between every item keep viewers moving forward.",
      sections: [
        { title: "Hook — Tease the Best Item", pct: 5, purpose: "Flash the most impressive entry without revealing it fully.", prompts: ["What's the most jaw-dropping item? Tease it, don't explain it."] },
        { title: "The Promise / Criteria", pct: 5, purpose: "How you ranked them and why the list matters.", prompts: ["What's the ranking criteria in one sentence?"] },
        { title: "Item 5 (solid, not weakest-feeling)", pct: 14, purpose: "Start strong enough to keep people. Story + fact for each item.", prompts: ["One story, one surprising fact, one 'why it matters'."] },
        { title: "Item 4", pct: 14, purpose: "Escalate. Use a transition that re-hooks.", prompts: ["Transition line: 'But that's nothing compared to…'"] },
        { title: "Item 3", pct: 15, purpose: "Mid-point pattern interrupt: change format, add a demo or a question.", prompts: ["How can this item feel different in format from the others?"] },
        { title: "Item 2", pct: 15, purpose: "Near-peak.", prompts: ["Remind viewers #1 is coming and why it's different."] },
        { title: "Item 1 — The Payoff", pct: 22, purpose: "Deliver on the hook. Longest, richest segment.", prompts: ["Does this genuinely beat every other item?"] },
        { title: "Wrap & Next", pct: 10, purpose: "Brief recap, bridge to next video.", prompts: ["Which related video should they watch next and why?"] },
      ],
    },
    {
      id: "tutorial",
      name: "Teaching Tutorial",
      blurb:
        "Show the result first, explain why people fail, then a clear step framework with common mistakes called out.",
      sections: [
        { title: "Result-first Hook", pct: 5, purpose: "Show the end result the viewer wants.", prompts: ["What will the viewer be able to do by the end?"] },
        { title: "Why Most People Get This Wrong", pct: 10, purpose: "Name the common mistake / misconception.", prompts: ["What's the #1 mistake beginners make?"] },
        { title: "The Framework (overview)", pct: 10, purpose: "Give the map: 3–5 named steps.", prompts: ["Can each step have a memorable name?"] },
        { title: "Step 1", pct: 15, purpose: "Explain → demonstrate → common mistake.", prompts: ["Show a bad example vs a good example."] },
        { title: "Step 2", pct: 15, purpose: "Explain → demonstrate → common mistake.", prompts: [] },
        { title: "Step 3", pct: 15, purpose: "Explain → demonstrate → common mistake.", prompts: [] },
        { title: "Putting It Together", pct: 15, purpose: "Full worked example start to finish.", prompts: ["Use a realistic, specific example."] },
        { title: "Recap & Next Step", pct: 15, purpose: "Recap steps, give one action to do today.", prompts: ["What should the viewer do in the next 10 minutes?"] },
      ],
    },
    {
      id: "blank",
      name: "Blank (free writing)",
      blurb: "One open section. The analyzer still works on everything you write.",
      sections: [{ title: "Script", pct: 100, purpose: "Write freely.", prompts: [] }],
    },
  ];

  // ---------------------------------------------------------------------------
  // Hook types. `fields` feed the generator; `{field}` placeholders in patterns.
  // Examples are original illustrations, not quotes.
  // ---------------------------------------------------------------------------
  const HOOKS = [
    {
      id: "cold-open",
      name: "Cold Open (in medias res)",
      why: "Starts mid-action at the most dramatic moment. The brain wants to know how we got here and how it ends.",
      bestFor: "Stories, documentaries, history, challenges",
      fields: ["moment", "time", "consequence"],
      labels: { moment: "The dramatic moment", time: "When/where", consequence: "What was about to happen" },
      patterns: [
        "{time}. {moment}. In a few minutes, {consequence}.",
        "{moment}. It's {time}, and nobody yet knows that {consequence}.",
        "This is {time}. {moment} — and it's about to lead to {consequence}.",
      ],
      example: "March 1979. An alarm goes off in a control room in Pennsylvania. Within hours, operators will make a decision that nearly melts a reactor core.",
    },
    {
      id: "misconception",
      name: "Misconception / Contrarian",
      why: "Challenges something the viewer believes. Holding a belief that's being questioned creates instant tension — and, per Muller's research, addressing misconceptions improves actual learning.",
      bestFor: "Science, finance, health, history myths",
      fields: ["belief", "truth"],
      labels: { belief: "What most people believe", truth: "What's actually true (hinted)" },
      patterns: [
        "You've probably been told {belief}. It's wrong — and the real reason is far stranger: {truth}.",
        "Almost everyone believes {belief}. I did too. Then I found out {truth}.",
        "{belief}? That's the answer most people give. It's also not true. {truth}.",
      ],
      example: "You were probably taught that seasons happen because Earth gets closer to the Sun. It's wrong — in fact, the Northern Hemisphere's winter happens when we're closest.",
    },
    {
      id: "question",
      name: "Curiosity Question",
      why: "Opens an information gap (Loewenstein). Works best when the viewer already knows a little, so the gap feels closable.",
      bestFor: "Explainers, 'why does X' videos",
      fields: ["thing", "oddity"],
      labels: { thing: "Familiar thing", oddity: "The odd detail about it" },
      patterns: [
        "Why does {thing} {oddity}? The answer involves something you'd never guess.",
        "Have you ever noticed that {thing} {oddity}? There's a reason — and it's not what you think.",
        "{thing} {oddity}. Nobody designed it that way on purpose. So why?",
      ],
      example: "Why are almost all airplane windows round? The answer was written in the wreckage of three crashed jets.",
    },
    {
      id: "stakes",
      name: "High Stakes",
      why: "Something valuable can be won or lost. Stakes make the viewer emotionally invested in the outcome.",
      bestFor: "Challenges, business stories, experiments",
      fields: ["who", "risk", "deadline"],
      labels: { who: "Who's at risk", risk: "What could be lost/won", deadline: "Time pressure" },
      patterns: [
        "{who} had {deadline} to save {risk}. Almost everything they tried made it worse.",
        "If {who} got this wrong, {risk} was gone. And they had {deadline}.",
        "{deadline}. That's all {who} had before losing {risk}.",
      ],
      example: "The company had 48 hours of cash left. The founder's last idea was a gamble that either saves 400 jobs — or ends them.",
    },
    {
      id: "number",
      name: "Shocking Number / Specific Fact",
      why: "Specific numbers feel credible and concrete. Scale surprises the brain into paying attention.",
      bestFor: "Data-driven explainers, economics, science",
      fields: ["number", "context", "implication"],
      labels: { number: "The number", context: "What it measures", implication: "Why it's shocking" },
      patterns: [
        "{number}. That's {context}. And it means {implication}.",
        "There are {number} {context}. Let that sink in, because it means {implication}.",
        "{context}: {number}. Here's why that number should worry — or amaze — you: {implication}.",
      ],
      example: "Ninety-six percent. That's how much of the universe we can't see. Everything you've ever touched is the other four.",
    },
    {
      id: "preview",
      name: "Result Preview / Promise",
      why: "Shows the payoff up front so viewers know the time investment is worth it. Then makes them wait for HOW.",
      bestFor: "Tutorials, transformations, experiments",
      fields: ["result", "method"],
      labels: { result: "The impressive result", method: "The intriguing method (hinted)" },
      patterns: [
        "This is {result}. By the end of this video you'll know exactly how — and it starts with {method}.",
        "{result}. No tricks. Just {method}, and I'll show you every step.",
        "Here's {result}. The surprising part? It all comes down to {method}.",
      ],
      example: "This bridge is made of spaghetti and holds 20 kilos. By the end of this video you'll know why the triangle shape makes it possible.",
    },
    {
      id: "confession",
      name: "Personal Confession",
      why: "Vulnerability builds trust and relatability fast. The viewer wants to see how you got out of it.",
      bestFor: "Personal essays, lessons learned, self-improvement",
      fields: ["mistake", "lesson"],
      labels: { mistake: "Your mistake / failure", lesson: "What it taught you (hinted)" },
      patterns: [
        "I {mistake}. It was the worst decision I've made — and it taught me {lesson}.",
        "For years I {mistake}. Here's what finally changed: {lesson}.",
        "I need to admit something: I {mistake}. What I learned from it — {lesson} — changed everything.",
      ],
      example: "I spent two years and my savings building something nobody wanted. Here's the one question I should have asked on day one.",
    },
    {
      id: "imagine",
      name: "'Imagine' Scenario",
      why: "Puts the viewer inside the story in second person. Great for abstract concepts that need to feel physical.",
      bestFor: "Science, hypotheticals, history ('imagine you lived in…')",
      fields: ["scenario", "twist"],
      labels: { scenario: "The scenario", twist: "The twist / question" },
      patterns: [
        "Imagine {scenario}. Now imagine {twist}. That's not science fiction — it really happened.",
        "Picture this: {scenario}. What you don't know yet is {twist}.",
        "You're {scenario}. Everything seems normal. Then {twist}.",
      ],
      example: "Imagine you're falling into a black hole. To you, everything seems normal. To anyone watching, you'd freeze in time forever.",
    },
  ];

  // ---------------------------------------------------------------------------
  // The playbook: principles grouped by theme. `src` refers to SOURCES ids.
  // ---------------------------------------------------------------------------
  const PLAYBOOK = [
    {
      theme: "1. Hook & First Minute",
      items: [
        { t: "The first minute is where most viewers leave", d: "Treat the first 60 seconds as the most important part of the video, and minutes 1–3 and 3–6 as the next priorities. Spend disproportionate writing time here.", src: ["mrbeast"] },
        { t: "Hook within 5–15 seconds", d: "Within the first 5–15 seconds confirm the viewer is in the right place, promise something worth staying for, and open a loop you don't close yet.", src: ["sumera", "prepublish"] },
        { t: "Kill the preamble", d: "No 'Hey guys, welcome back', no channel intro, no 'before we start, subscribe'. Long branded intros rarely add value. Get straight to the most interesting part — context can come later.", src: ["galloway", "vidiq"] },
        { t: "Deliver on the title & thumbnail", d: "Packaging decides whether people click; the hook decides whether they stay. Restate or visibly confirm the packaging promise in the first 30 seconds so the viewer knows they clicked the right thing.", src: ["galloway"] },
        { t: "Benchmark: ~50% still watching at 30s", d: "YouTube's 'typical intro' comparison uses roughly half the audience still watching at 30 seconds. Compare against your own similar videos, not just the platform average.", src: ["intro-retention"] },
      ],
    },
    {
      theme: "2. Structure & Momentum",
      items: [
        { t: "BUT / THEREFORE, never AND THEN", d: "Trey Parker & Matt Stone: if your beats connect with 'and then', it's a list, not a story. Connect beats with 'but' (complication) or 'therefore' (consequence) to create causation.", src: ["but-therefore"] },
        { t: "And → But → Therefore (ABT)", d: "Randy Olson's science-communication template: set up the facts (AND), introduce the problem (BUT), resolve it (THEREFORE). Escape 'the land of And' — stacking facts with no tension.", src: ["abt"] },
        { t: "Open loops, then close every one", d: "Plant questions early and answer them later. Aim for several per script but always pay them off — unresolved loops destroy trust, and too many feel manipulative.", src: ["sumera", "mysocial"] },
        { t: "Re-hook every 60–90 seconds", d: "Viewers' attention decays. Every minute or so, add a new question, a twist, a stakes escalation, or a pattern interrupt (format change, demo, story pivot).", src: ["mrbeast", "prepublish"] },
        { t: "Escalate the stakes", d: "Each section should matter more than the last — more money, more time pressure, more consequence, a bigger mystery. Never put your best material first and coast.", src: ["mrbeast"] },
        { t: "Overlap your sections", d: "Open the next question before you finish answering the current one, so there's never a natural 'exit point' between segments.", src: ["prepublish"] },
      ],
    },
    {
      theme: "3. Teaching So It Sticks",
      items: [
        { t: "Address the misconception first", d: "Derek Muller's PhD research found clear, polished explanations made viewers MORE confident but not more correct. Videos that first presented the common misconception and then corrected it produced better learning, because viewers had to think harder.", src: ["muller"] },
        { t: "Questions before answers", d: "Pose the question and let the viewer wonder before explaining. Curiosity (an information gap) is linked with better memory — especially when the answer feels knowable.", src: ["loewenstein", "veritasium-summary"] },
        { t: "Show, don't lecture", d: "Present evidence and let the viewer investigate alongside you — the detective approach — instead of announcing conclusions.", src: ["harris-detective"] },
        { t: "Minimum viable context", d: "Give only the background needed for the next beat, delivered as story (who, where, when). Context that's never paid off is where viewers leave.", src: ["prepublish"] },
        { t: "Concrete beats abstract", d: "Ground every abstract idea in a specific example, real number, physical analogy or visual. Higher-performing explainers lean into visceral, concrete stakes over abstract philosophy.", src: ["kurzgesagt"] },
        { t: "Recap the key point when it's needed", d: "Viewers forget what you said in the intro. Briefly restate key facts right before the moment they matter.", src: ["skool"] },
      ],
    },
    {
      theme: "4. Storytelling",
      items: [
        { t: "Give it a protagonist", d: "Even a science topic needs a person (a scientist, a victim, a viewer stand-in) who wants something and faces obstacles.", src: ["abt"] },
        { t: "A-plot / B-plot", d: "Run a human story alongside the explanation. Cut between them so each one re-hooks the other.", src: ["veritasium-summary"] },
        { t: "Cold open, then rewind", d: "Start at the moment of maximum tension, then go back to explain how we got there.", src: ["vidiq"] },
        { t: "Visual-first writing", d: "Write with the picture in mind — what will be ON SCREEN for each line? Front-load visual anchors in the first 30–60 seconds.", src: ["harris-process"] },
        { t: "Callback ending", d: "Return to your opening image or question with new meaning. It feels complete and rewards viewers who stayed.", src: ["prepublish"] },
      ],
    },
    {
      theme: "5. Writing for the Ear",
      items: [
        { t: "Write how you talk", d: "Contractions, plain words, one idea per sentence. Read every line aloud — or record and play it back.", src: ["voiceover"] },
        { t: "Vary sentence length", d: "Keep most sentences short (≈15–20 words max) but mix in longer ones — all-short sounds choppy and robotic.", src: ["voiceover"] },
        { t: "Talk to ONE person: 'you'", d: "Second person pulls the viewer into the story. 'You' is the most powerful word in a script.", src: ["voiceover"] },
        { t: "Plan runtime with words-per-minute", d: "Conversational narration runs roughly 130–160 wpm. Duration (s) = words ÷ wpm × 60. Slower for emotional or technical passages.", src: ["voiceover"] },
        { t: "Cut filler and hedges", d: "Words like 'basically', 'really', 'very', 'kind of', 'just' drain energy. Cut them unless they are doing deliberate work.", src: ["voiceover"] },
      ],
    },
    {
      theme: "6. Endings",
      items: [
        { t: "Don't signal the end", d: "'So that's it', 'to wrap up' and 'in conclusion' cause instant drop-off. End on the final payoff line, not a goodbye.", src: ["prepublish"] },
        { t: "Bridge to the next video", d: "While curiosity is high, point to one specific related video and say WHY they'll want it — instead of a generic like/subscribe ask.", src: ["prepublish"] },
      ],
    },
  ];

  // Self-check list used by the "Pre-flight" panel.
  const CHECKLIST = [
    "Hook lands in the first 15 seconds / ~40 words",
    "No greetings, channel intro or subscribe ask before the hook",
    "Title & thumbnail promise confirmed in the first 30 seconds",
    "The main question (open loop) is stated clearly near the start",
    "A common misconception is named and then corrected",
    "Beats connect with BUT / THEREFORE, not AND THEN",
    "Something new (question, twist, stakes) at least every 60–90 seconds",
    "Every abstract idea has a concrete example, number or analogy",
    "There is a person / protagonist the viewer can follow",
    "Every open loop is closed before the end",
    "Each line has a planned visual",
    "Read aloud: no tongue-twisters, no sentence needs a breath mid-way",
    "Ending calls back to the opening and bridges to a next video",
  ];

  const SOURCES = {
    mrbeast: { name: "'How to Succeed in MrBeast Production' (leaked guide) — summary", url: "https://www.alexanderjarvis.com/memo-how-to-succeed-in-mrbeast-production/" },
    galloway: { name: "Colin and Samir — The new rules of YouTube from Paddy Galloway", url: "https://www.colinandsamir.com/resources/the-new-rules-of-youtube-from-paddy-galloway" },
    "intro-retention": { name: "Creator Essentials — Intro Retention", url: "https://www.creatoressentials.com/glossary/intro-retention/" },
    sumera: { name: "Sumera — Video Script Writing for YouTube: Hook, Retention, Structure", url: "https://sumera.io/blog/how-to-write-youtube-script-keeps-viewers-watching" },
    prepublish: { name: "Prepublish — YouTube Script Structure: Hook, Build, Payoff", url: "https://prepublish.ai/guides/script-structure-guide" },
    mysocial: { name: "MySocial — How to Write a YouTube Script That Keeps Viewers Watching", url: "https://mysocial.io/blog/make-youtube-script/" },
    vidiq: { name: "vidIQ — YouTube Hooks That Keep Viewers Watching", url: "https://vidiq.com/blog/post/youtube-intros/" },
    "but-therefore": { name: "David Perell — The But & Therefore Rule (Parker & Stone)", url: "https://perell.com/note/but-therefore-rule/" },
    abt: { name: "NCSE — And, But, Therefore: Randy Olson and the Art of Science Storytelling", url: "https://ncse.ngo/and-therefore-randy-olson-and-art-science-storytelling-part-1" },
    muller: { name: "THE Journal — Watching Videos Does Not Necessarily Lead to Learning (Muller's research)", url: "https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx" },
    loewenstein: { name: "Loewenstein — The Psychology of Curiosity (information-gap theory), CMU", url: "https://www.cmu.edu/dietrich/sds/docs/loewenstein/WickCandleLearning.pdf" },
    "veritasium-summary": { name: "UQ Science Communication — The Curiosity Gap", url: "https://uq.pressbooks.pub/science-communication/chapter/the-curiosity-gap/" },
    "harris-detective": { name: "Johnny Harris and the Detective Story Formula (analysis)", url: "https://blog.editorduel.com/blog/johnny-harris-detective-story-formula-explainer-videos" },
    "harris-process": { name: "How Johnny Harris Mastered Visual Storytelling", url: "https://medium.com/@LMK_writing/how-johnny-harris-mastered-visual-storytelling-on-youtube-343ddf9160ec" },
    kurzgesagt: { name: "Prepublish — Kurzgesagt script breakdown", url: "https://prepublish.ai/breakdowns/kurzgesagt" },
    skool: { name: "Content Academy — YouTube retention strategies", url: "https://skool.com/content-academy/here-are-the-best-15-youtube-retention-strategies" },
    voiceover: { name: "The eLearning Coach — The Art of Writing Great Voice-Over Scripts", url: "https://theelearningcoach.com/elearning_design/the-art-of-writing-great-voice-over-scripts/" },
  };

  // ---------------------------------------------------------------------------
  // Writer style profiles: what top educational / story channels do, distilled
  // from interviews and third-party breakdowns. Used to steer the rewrite.
  // These describe techniques, not anyone's exact voice.
  // ---------------------------------------------------------------------------
  const STYLES = [
    {
      id: "auto",
      name: "Best fit for my topic",
      inspired: "Mix of all below",
      summary: "Picks the techniques that suit your topic: misconception-first for science, investigation for history or geopolitics, a character journey for biographies.",
      rules: [
        "Choose the most suitable techniques from the other style profiles for this topic and audience.",
      ],
      template: "edu-story",
    },
    {
      id: "investigator",
      name: "Curious Investigator",
      inspired: "Veritasium-style science storytelling",
      summary: "Starts with what people wrongly believe, asks questions before giving answers, runs a human A-plot beside the science B-plot.",
      rules: [
        "Open by surfacing a common misconception and make the viewer commit to a guess.",
        "Ask the question and let it hang before answering; reveal through experiment or evidence.",
        "Run a human story (a scientist, an accident, a discovery) alongside the explanation and cut between them.",
        "Explicitly contrast the wrong mental model with the right one.",
      ],
      src: ["muller", "veritasium-summary"],
      template: "edu-story",
    },
    {
      id: "detective",
      name: "Detective Documentary",
      inspired: "Johnny Harris-style visual investigation",
      summary: "First-person investigation. Shows a strange map, image or document and works through clues with the viewer.",
      rules: [
        "Open on a strange, specific visual (a map, a photo, a document) and ask what is going on.",
        "Narrate as a first-person investigator: 'So I started digging…', 'This is where it got weird.'",
        "Show evidence, then ask; never just announce conclusions.",
        "Write a visual note in [brackets] for nearly every line; front-load visual anchors in the first 30–60 seconds.",
      ],
      src: ["harris-detective", "harris-process"],
      template: "detective",
    },
    {
      id: "engineer",
      name: "Engineer's Thriller",
      inspired: "Mark Rober-style build-and-test stories",
      summary: "The science is the reward, not the price of entry. Builds suspense through attempts, failures and reveals, and aims for a feeling.",
      rules: [
        "Focus on the feeling: decide the emotion the viewer should leave with and build toward it.",
        "Hide the vegetables: wrap the science inside an entertaining goal, and explain it at the moment it pays off.",
        "Show attempts that fail and what was learned; each failure is a BUT that motivates the next try.",
        "Set up a rhythm, then break it with a surprise.",
        "Give names and personality to characters, even objects or animals.",
      ],
      src: ["rober-storyrules", "rober-stanford"],
      template: "character",
    },
    {
      id: "bigpicture",
      name: "Big-Picture Explainer",
      inspired: "Kurzgesagt-style science explainers",
      summary: "Calm, clear narrator, concrete scale comparisons and visceral stakes, ending on a zoomed-out, meaningful takeaway.",
      rules: [
        "Lead with immediate, visceral stakes (your body, your planet, your survival) rather than abstract ideas.",
        "Make huge or tiny numbers tangible with scale comparisons to everyday things.",
        "Use a calm, warm narrator voice with short, clear sentences and gentle humour.",
        "End by zooming out to what this means for humanity or for the viewer, on a hopeful note.",
      ],
      src: ["kurzgesagt"],
      template: "edu-story",
    },
    {
      id: "analyst",
      name: "Straight-to-the-Problem Analyst",
      inspired: "Wendover Productions-style logistics and economics explainers",
      summary: "No slow lead-in. States the central problem first (inverted pyramid), then unpacks it with data, systems and trade-offs.",
      rules: [
        "Skip any lead-in: confront the central problem or surprising conclusion in the first lines.",
        "Use an inverted pyramid: give the most important conclusion or question first, then the layers beneath it.",
        "Explain systems and trade-offs with specific numbers, routes, costs and constraints.",
      ],
      src: ["wendover"],
      template: "edu-story",
    },
    {
      id: "onetake",
      name: "One-Take Storyteller",
      inspired: "Tom Scott-style to-camera explainers",
      summary: "Dense, precise and conversational, anchored to a real place or object, with no wasted words. Short enough to deliver in one take.",
      rules: [
        "Anchor the video to a specific real place, object or fact ('This is…').",
        "Every sentence carries information: no filler, no hype words.",
        "Conversational and precise; gentle wit; one clear point by the end.",
        "Keep it tight enough to deliver to camera in a single take.",
      ],
      src: ["tomscott"],
      template: "edu-story",
    },
    {
      id: "challenge",
      name: "High-Energy Stakes",
      inspired: "MrBeast production-guide retention style",
      summary: "Simple language, escalating stakes every 60–90 seconds and constant re-hooks. Nothing is allowed to feel slow.",
      rules: [
        "Treat the first minute as the most important; get to the premise in the first sentence.",
        "Escalate stakes (money, time, difficulty, consequence) roughly every 60–90 seconds.",
        "Very simple words and short sentences; constant forward momentum.",
        "Never let a segment end without teasing the next.",
      ],
      src: ["mrbeast"],
      template: "countdown",
    },
  ];

  // Extra hook type from short-form research.
  HOOKS.push({
    id: "contrast",
    name: "Context → But → Snapback",
    why: "Kallaway's layered hook. Make the topic clear instantly, interrupt with 'but', then snap to a contrarian angle. The bigger the gap between what the viewer believes and your angle, the stronger the hook.",
    bestFor: "Shorts, commentary, myth-busting",
    fields: ["context", "common", "snapback"],
    labels: { context: "Topic in plain words", common: "What everyone assumes", snapback: "Your contrarian angle" },
    patterns: [
      "{context}. Everyone thinks {common}. But {snapback}.",
      "You've heard that {common}. But when it comes to {context}, {snapback}.",
      "{context} — most people assume {common}. But here's the thing: {snapback}.",
    ],
    example: "Everyone thinks the Great Wall of China is visible from space. But astronauts say you can see a highway more easily than the wall.",
  });

  PLAYBOOK.splice(4, 0, {
    theme: "4b. Lessons From Top Writers",
    items: [
      { t: "Focus on the feeling (Mark Rober)", d: "Facts are forgotten; feelings stick. Decide the emotion the viewer should leave with, whether awe, satisfaction or surprise, and build the story toward it.", src: ["rober-stanford"] },
      { t: "Hide the vegetables (Mark Rober)", d: "Make the science the reward, not the prerequisite. Wrap the lesson inside an entertaining goal and teach it at the moment it's needed.", src: ["rober-storyrules"] },
      { t: "Set up a rhythm, then break it", d: "Repeating a pattern (attempt, fail, attempt) builds expectation, and breaking it creates surprise. Each failed solution is a BUT that motivates the next reveal.", src: ["rober-effect"] },
      { t: "Inverted pyramid (Wendover)", d: "For analytical explainers, skip the lead-in: put the central problem or most striking conclusion first, then unpack the layers beneath it.", src: ["wendover"] },
      { t: "Every sentence earns its place (Tom Scott)", d: "Dense, precise, conversational scripts anchored to a real place or object. If a sentence carries no information or feeling, cut it.", src: ["tomscott"] },
      { t: "Context, but, contrarian snapback (Kallaway)", d: "Make the topic clear in the first second, interrupt with 'but', then offer an angle that contrasts with what the viewer believes.", src: ["kallaway"] },
    ],
  });
  PLAYBOOK.forEach((t, i) => { t.theme = (i + 1) + ". " + t.theme.replace(/^\S+\s/, ""); });

  Object.assign(SOURCES, {
    "rober-stanford": { name: "Stanford Daily — Mark Rober on scientific storytelling", url: "https://stanforddaily.com/2025/05/19/youtuber-and-former-nasa-engineer-mark-rober-draws-full-crowd-speaks-to-scientific-storytelling/" },
    "rober-storyrules": { name: "Story Rules — Science storytelling tips from Mark Rober", url: "https://www.storyrules.com/science-storytelling-tips-from-mark-rober/" },
    "rober-effect": { name: "Deconstructing the Mark Rober Effect (ft. Hayden Hillier-Smith)", url: "https://rosetta.to/u/digspaghetti/deconstructing-the-mark-rober-effect-ft-hayden-hillier-smith" },
    wendover: { name: "Wendover Productions script pattern breakdown", url: "https://prepublish.ai/breakdowns/wendoverproductions" },
    tomscott: { name: "Tom Scott script pattern breakdown", url: "https://prepublish.ai/breakdowns/tomscott" },
    kallaway: { name: "Kallaway — How to create irresistible hooks (summary)", url: "https://videohighlight.com/v/LmXpbP7dD48" },
  });

  const KB = { TEMPLATES, HOOKS, PLAYBOOK, CHECKLIST, SOURCES, STYLES };
  if (typeof module !== "undefined" && module.exports) module.exports = KB;
  else root.KB = KB;
})(typeof window !== "undefined" ? window : globalThis);
