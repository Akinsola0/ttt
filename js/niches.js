/*
 * ScriptCraft niche profiles. Each niche tunes the Script Doctor (default style,
 * structure, pace, rewrite rules) and adds niche-specific checks to the diagnosis.
 * `checks`: { label, pattern (regex source, case-insensitive), mustHave, why }.
 * Must load after knowledge.js.
 */
(function (root) {
  "use strict";
  const KB = (typeof module !== "undefined" && module.exports) ? require("./knowledge.js") : root.KB;

  // Spy niche structure: the "Oddity File" blueprint (8-minute timings scaled to %).
  KB.TEMPLATES.splice(KB.TEMPLATES.length - 1, 0, {
    id: "oddity-file",
    name: "Spy Thriller File (cold open → file closes)",
    blurb: "A true spy story told like a short thriller film: drop into danger, meet the person, follow the game, escalate, crack, reveal, then close the file on an ironic last line.",
    sections: [
      { title: "Cold Open", pct: 5, purpose: "Drop into the most dangerous or bizarre moment. Cut away just before the outcome. No context yet.", prompts: ["What is the single most dangerous or strange moment in this story?", "Where exactly do you cut away, one beat before we learn what happens?"] },
      { title: "The Promise", pct: 5, purpose: "Name the person and the central question. Tease the twist without revealing it.", prompts: ["'This is the story of how ___ ___.'", "What question will the reveal answer?"] },
      { title: "The Person", pct: 15, purpose: "Ordinary life, a flaw or motive (money, ideology, revenge, ego, love), and how they entered the spy world.", prompts: ["Which MICE motive drove them: Money, Ideology, Coercion or Ego?", "One specific, humanising detail.", "Contrast: 'By day… By night…'"] },
      { title: "The Game Begins", pct: 19, purpose: "First mission, method or deception. Show the tradecraft in concrete detail. Open a new loop.", prompts: ["What exact tradecraft did they use (dead drops, codes, hollow objects, cover identities)?", "What new question does this open?"] },
      { title: "Escalation", pct: 25, purpose: "Bigger risks and close calls, with a mid-video twist. Each section ends on a question.", prompts: ["What's the closest call?", "Dramatic irony: what does the viewer know that the spy doesn't?", "Where is the mid-video twist?"] },
      { title: "The Crack", pct: 16, purpose: "Suspicion, betrayal, a mistake, the hunt closing in. Darkest, slowest, tensest part.", prompts: ["What small mistake or betrayal started the end?", "Slow the rhythm: short lines, silence, specific sounds."] },
      { title: "The Reveal", pct: 9, purpose: "Pay off the cold open and the promise. Deliver the twist.", prompts: ["Return to the cold-open moment. What really happened?", "Land the twist in one short sentence."] },
      { title: "The File Closes", pct: 6, purpose: "What happened after, the strange aftermath, one haunting or ironic final line, then a short tease of a related file.", prompts: ["What's the ironic or haunting last line?", "One sentence teasing a related story."] },
    ],
  });

  KB.STYLES.push({
    id: "spy-thriller",
    name: "Spy Thriller Narrator",
    inspired: "Cinematic true-espionage documentary",
    summary: "Neutral third-person documentary voice. Gritty in danger scenes, dry and witty in setup and irony. Feels like a short thriller film that happens to be true.",
    rules: [
      "Narrator is neutral and third person only: never 'I', never names the channel, never 'welcome back' or 'in this video'.",
      "Gritty tension in danger scenes; dry irony and sharp one-liners in setup and irony beats.",
      "Use dramatic irony: let the viewer learn about the trap before the spy does.",
      "Specific beats summary: exact objects, places, dates and numbers (a hollow nickel, 11 days, a numbered room).",
      "Short punchy lines in tense moments; longer flowing lines in setup.",
      "Include at least one jaw-drop true detail and tag it [ODDITY].",
      "Add [pause] / [long pause] markers and *italics* on words to stress, for the voiceover.",
    ],
    src: [],
    template: "oddity-file",
  });

  const NICHES = [
    {
      id: "spy",
      name: "Spy, Classified & Declassified Stories",
      tagline: "True espionage told like a thriller, backed by real documents.",
      style: "spy-thriller", template: "oddity-file", wpm: 140, minutes: 8,
      audience: "History and thriller fans who want real secrets and hate fake ones. They reward precision, documents on screen and moral grey areas.",
      wants: [
        "One person to follow, with high personal stakes: capture, execution, betrayal.",
        "Real tradecraft in concrete detail: dead drops, one-time pads, microdots, cover identities, hollow objects.",
        "A twist or ironic reveal, plus one detail so strange it sounds invented but is documented.",
        "Proof on screen: declassified pages, redactions, case files, maps, period photos (stylised, never fake photos).",
      ],
      hooks: [
        "Cold open inside the danger: “The man in the grey coat had ninety seconds to get rid of the film. Behind him, the footsteps stopped.”",
        "The redaction hook: “The document is 40 pages long. Thirty-one of them are blacked out. The one line they missed tells you everything.”",
        "The impossible detail: “The most valuable secret of the Cold War was hidden inside a hollow coin. And it was found by a newspaper boy.”",
        "Contrast hook: “By day, he was a mid-level clerk nobody noticed. By night, he was the most dangerous man in the building.”",
      ],
      rehooks: [
        "But that wasn't the strangest part.",
        "Somewhere in the building, someone was already reading his file.",
        "What he didn't know was that the drop site was being watched.",
        "The file doesn't say who tipped them off. But there's a clue in the margin.",
        "Eleven days later, he made his first mistake.",
        "And the one person he trusted most was about to change sides.",
      ],
      rules: [
        "Use the Spy Thriller File beats: cold open in danger, the promise, the person, the game begins, escalation, the crack, the reveal, the file closes.",
        "Keep at least one open loop at all times; open a new loop before closing an old one.",
        "Never invent dialogue, quotes, dates or numbers. Frame dramatised moments carefully ('accounts say…', 'he must have known…'). Where sources disagree, say so in one line.",
        "Distinguish clearly between what the declassified record shows, what witnesses claimed, and what remains unknown or redacted.",
        "Put a short visual / animation prompt in [brackets] every 1–3 sentences: stylised 2D noir scenes, documents, maps, period objects. Never photo-real depictions of real people.",
        "Imply violence and death (shadows, aftermath, symbolic shots) rather than showing gore.",
        "End on the story's final ironic or haunting line, then at most one sentence teasing another file. No like/subscribe.",
      ],
      pitfalls: [
        "Presenting conspiracy theories or unverified claims as fact. One debunked claim costs the channel its credibility.",
        "Info-dumping agency history before the viewer cares about a person.",
        "Vague tradecraft (“he passed secrets”) instead of the specific method.",
        "Narrator breaking the fourth wall with “I” or channel plugs mid-story.",
        "Sensational titles the video doesn't pay off (“The CIA doesn't want you to know…”).",
      ],
      titles: [
        "The Spy Who [ironic contradiction]",
        "How a [ordinary job] Fooled the [agency]",
        "The [object] That Almost Started a War",
        "[Agency]'s Most Embarrassing Mission",
        "The Declassified File Nobody Read",
      ],
      thumbnails: "One stylised figure plus one object of tension (a coin, a film canister, a stamped file) on a dark, desaturated scene with a single accent colour. 2–4 words: “HE KNEW”, “DECLASSIFIED”, “REDACTED?”",
      research: [
        { name: "CIA FOIA Electronic Reading Room", url: "https://www.cia.gov/readingroom" },
        { name: "National Security Archive (George Washington University)", url: "https://nsarchive.gwu.edu/" },
        { name: "FBI Records: The Vault", url: "https://vault.fbi.gov/" },
        { name: "Wilson Center Digital Archive (Cold War international documents)", url: "https://digitalarchive.wilsoncenter.org/" },
        { name: "UK National Archives — Security Service (MI5) records", url: "https://www.nationalarchives.gov.uk/" },
        { name: "US National Archives (NARA) — JFK and declassified collections", url: "https://www.archives.gov/research" },
      ],
      checks: [
        { label: "Contains an [ODDITY] detail", pattern: "\\[ODDITY", mustHave: true, why: "Every file needs one jaw-drop detail that sounds invented but is real. Tag it [ODDITY]." },
        { label: "Narrator stays third person (no “I / my / me” outside quotes)", pattern: "\\b(I|I'm|I've|I'd|my|me|myself)\\b", mustHave: false, caseSensitive: true, ignoreQuotes: true, why: "The documentary narrator never says “I”." },
        { label: "No “in this video” or channel plugs", pattern: "(in this video|welcome back|this channel|subscribe)", mustHave: false, why: "Breaks the thriller spell." },
        { label: "Uses specific numbers, dates or places", pattern: "\\b(1[89]\\d\\d|20\\d\\d|\\d+ (days|hours|minutes|years|miles|kilometres|pages|dollars|roubles|pounds))\\b", mustHave: true, why: "Specifics beat summaries: dates, durations, amounts." },
        { label: "Signals sourcing (“documents show”, “according to”, “declassified”)", pattern: "(according to|documents? (show|reveal|suggest)|declassified|the file|records? (show|reveal)|accounts? (say|differ))", mustHave: true, why: "Tells viewers what's documented versus dramatised." },
        { label: "Has [pause] markers for the voiceover", pattern: "\\[(long )?pause\\]", mustHave: true, why: "Pauses before reveals carry the tension." },
      ],
    },
    {
      id: "truecrime",
      name: "True Crime",
      tagline: "Real cases, told with tension and respect.",
      style: "detective", template: "detective", wpm: 140, minutes: 15,
      audience: "Viewers who binge long-form cases and value thorough research, respect for victims and a clear timeline.",
      wants: ["A clear timeline and cast of characters.", "Evidence laid out so the viewer can play detective.", "Respect for victims and families.", "A satisfying explanation of how the case was solved, or why it wasn't."],
      hooks: ["“At 2:14 a.m., the neighbour's camera caught something nobody noticed for six years.”", "“The killer was in the very first police report. He was listed as a witness.”"],
      rehooks: ["But the timeline didn't add up.", "Then a second piece of evidence surfaced.", "Detectives had missed one thing."],
      rules: ["Centre victims as people, not plot devices.", "Separate proven facts, allegations and speculation; say 'alleged' where legally appropriate.", "Give a clear timeline with dates and places.", "Do not invent quotes; use court records and reporting."],
      pitfalls: ["Glamorising perpetrators.", "Gore for shock.", "Stating allegations as fact (a legal risk)."],
      titles: ["The [Case] That Fooled Everyone", "How One [small clue] Solved the [Case]"],
      thumbnails: "Location or evidence object, muted colour, one face only if appropriate. 2–3 words.",
      research: [{ name: "Court records and public case filings", url: "https://www.courtlistener.com/" }],
      checks: [
        { label: "Uses legal hedging (“alleged”, “accused”, “charged”)", pattern: "\\b(alleged(ly)?|accused|charged|convicted|acquitted)\\b", mustHave: true, why: "Protects you legally and keeps the record straight." },
        { label: "Anchors events in time", pattern: "\\b(\\d{1,2}(:\\d\\d)? ?(a\\.?m\\.?|p\\.?m\\.?)|19\\d\\d|20\\d\\d|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b", mustHave: true, why: "A clear timeline is the backbone of true crime." },
      ],
    },
    {
      id: "history",
      name: "History & Forgotten Stories",
      tagline: "The past, told as a story with stakes.",
      style: "investigator", template: "character", wpm: 145, minutes: 12,
      audience: "Curious viewers who want to feel what it was like to be there and to learn why it matters today.",
      wants: ["A person to follow through events.", "Vivid period detail.", "Myths busted with evidence.", "A link from then to now."],
      hooks: ["“In 1518, people in Strasbourg started dancing. Some didn't stop for weeks.”", "“Everything you learned about this battle came from one man. He wasn't there.”"],
      rehooks: ["But the records tell a different story.", "No one expected what happened next.", "Within a year, it would all be gone."],
      rules: ["Follow a person, not just events.", "Use period-specific details (prices, objects, places).", "Address a popular myth and correct it.", "Flag where historians disagree."],
      pitfalls: ["Date-dumping.", "Repeating popular myths uncritically.", "Judging the past without context."],
      titles: ["The Forgotten [event] That Changed [thing]", "Why [myth] Is Wrong"],
      thumbnails: "Period map or painting-style scene with one bold contrasting object.",
      research: [{ name: "Internet Archive (primary sources and books)", url: "https://archive.org/" }],
      checks: [{ label: "Mentions a year or era", pattern: "\\b(1\\d{3}|20\\d\\d|\\d{1,2}(st|nd|rd|th) century|BC|BCE|AD)\\b", mustHave: true, why: "Ground the viewer in time." }],
    },
    {
      id: "science",
      name: "Science & Engineering Explainers",
      tagline: "Make hard ideas feel obvious, and surprising.",
      style: "investigator", template: "edu-story", wpm: 150, minutes: 10,
      audience: "Curious minds who love an 'aha' moment and will share a video that makes them feel smart.",
      wants: ["A misconception corrected.", "Experiments or demos.", "Analogies they can repeat to friends.", "Real numbers at human scale."],
      hooks: ["“Drop a feather and a hammer on the Moon and they land together. So why does everyone get the reason wrong?”"],
      rehooks: ["So what's actually going on?", "Here's where it gets weird.", "But that explanation has a problem."],
      rules: ["Start from the misconception.", "Question before answer.", "Every abstract idea gets an analogy or demo.", "Use real measurements at human scale."],
      pitfalls: ["Jargon without definition.", "Explaining before the viewer cares.", "Oversimplifying until it's wrong."],
      titles: ["Why [familiar thing] Is [surprising]", "The [thing] Everyone Gets Wrong"],
      thumbnails: "One striking object or experiment, one question word.",
      research: [{ name: "Google Scholar", url: "https://scholar.google.com/" }],
      checks: [{ label: "Uses an analogy (“it's like”, “imagine”)", pattern: "(it'?s like|is like|imagine|think of|picture)", mustHave: true, why: "Analogies are how viewers remember." }],
    },
    {
      id: "space",
      name: "Space & Cosmos",
      tagline: "Awe at scale, explained simply.",
      style: "bigpicture", template: "edu-story", wpm: 140, minutes: 12,
      audience: "Viewers seeking awe and perspective; they love scale comparisons and big questions.",
      wants: ["Scale made tangible.", "Big existential questions.", "Latest discoveries, explained."],
      hooks: ["“If the Sun were a front door, the nearest star would be another front door 7,000 kilometres away.”"],
      rehooks: ["And that's not even the biggest one.", "Now zoom out."],
      rules: ["Make every huge number tangible with an everyday comparison.", "Separate confirmed findings from hypotheses.", "End on perspective and wonder."],
      pitfalls: ["Raw numbers with no comparison.", "Stating hypotheses as facts."],
      titles: ["What If [cosmic event]?", "The Biggest [thing] in the Universe"],
      thumbnails: "Dramatic cosmic visual plus a tiny human-scale object for contrast.",
      research: [{ name: "NASA Science", url: "https://science.nasa.gov/" }],
      checks: [{ label: "Has a scale comparison", pattern: "(the size of|as big as|times (bigger|larger|smaller|heavier)|if .* were)", mustHave: true, why: "Space numbers mean nothing without comparison." }],
    },
    {
      id: "business",
      name: "Business & Finance Stories",
      tagline: "How money, companies and markets really work.",
      style: "analyst", template: "character", wpm: 155, minutes: 12,
      audience: "Ambitious viewers who want to understand how companies rise and fall, and what they can apply.",
      wants: ["Rise-and-fall arcs with a founder at the centre.", "Real numbers (revenue, valuations, losses).", "A lesson they can apply."],
      hooks: ["“In 2008, this company was worth nothing. Ten years later, it was worth more than the company that laughed at it.”"],
      rehooks: ["But the numbers were hiding a problem.", "Then the market turned."],
      rules: ["Follow a founder or decision-maker.", "Use specific figures with years and currencies.", "Explain one business concept clearly per section.", "No financial advice; frame it as a story and analysis."],
      pitfalls: ["Hype without numbers.", "Giving investment advice."],
      titles: ["The Rise and Fall of [company]", "How [company] Made [amount] From [unlikely thing]"],
      thumbnails: "Logo or product plus an up or down arrow, one number.",
      research: [{ name: "SEC EDGAR company filings", url: "https://www.sec.gov/edgar/search/" }],
      checks: [{ label: "Uses specific money figures", pattern: "([$€£]\\s?\\d|\\d+(\\.\\d+)? ?(million|billion|trillion))", mustHave: true, why: "Business stories live on real numbers." }],
    },
    {
      id: "geopolitics",
      name: "Geopolitics & World Explainers",
      tagline: "Why the map looks the way it does.",
      style: "detective", template: "detective", wpm: 150, minutes: 14,
      audience: "Viewers who want to understand the news beneath the headlines, through maps and history.",
      wants: ["Maps.", "Historical roots of current events.", "Balanced perspectives.", "What happens next."],
      hooks: ["“Look at this border. It's a perfectly straight line through a desert. Someone drew it with a ruler in 1916.”"],
      rehooks: ["To understand why, look at the map again.", "But that's only one side of it."],
      rules: ["Anchor on a map or a place.", "Present multiple perspectives fairly.", "Separate facts from analysis and prediction."],
      pitfalls: ["One-sided framing.", "Outdated facts on fast-moving topics."],
      titles: ["Why [country] Is [surprising fact]", "The [line/border/route] That Explains [conflict]"],
      thumbnails: "Map with one highlighted region and an arrow.",
      research: [{ name: "CIA World Factbook", url: "https://www.cia.gov/the-world-factbook/" }],
      checks: [{ label: "References a map or place", pattern: "(map|border|look at|region|coast|river|capital)", mustHave: true, why: "Geopolitics is told through geography." }],
    },
    {
      id: "mystery",
      name: "Mysteries & Unsolved",
      tagline: "The unexplained, examined honestly.",
      style: "detective", template: "detective", wpm: 140, minutes: 12,
      audience: "Viewers who love an unsolved puzzle and want every theory weighed fairly.",
      wants: ["Atmosphere.", "Every theory, ranked by evidence.", "An honest verdict."],
      hooks: ["“The ship was found drifting, perfectly intact. Breakfast was still on the table. The crew was never seen again.”"],
      rehooks: ["That theory has one fatal flaw.", "Then investigators found something odd."],
      rules: ["Present the facts first, then theories.", "Weigh each theory against the evidence.", "Be honest about what's unknown."],
      pitfalls: ["Treating debunked theories as open.", "Never giving a verdict."],
      titles: ["The Unsolved Mystery of [thing]", "What Really Happened to [person/ship]?"],
      thumbnails: "Eerie scene with one unexplained object; a question mark.",
      research: [{ name: "Internet Archive newspaper collections", url: "https://archive.org/details/newspapers" }],
      checks: [{ label: "Weighs theories (“theory”, “evidence”, “explanation”)", pattern: "\\b(theory|theories|evidence|explanation|likely|unlikely)\\b", mustHave: true, why: "Viewers want theories weighed, not just listed." }],
    },
    {
      id: "psychology",
      name: "Psychology & Self-Improvement",
      tagline: "Research-backed insight people can use today.",
      style: "investigator", template: "tutorial", wpm: 150, minutes: 10,
      audience: "Viewers who want to understand themselves and change a habit, and who trust research over hype.",
      wants: ["Relatable scenarios.", "Studies explained simply.", "One actionable step."],
      hooks: ["“You've probably done this today without noticing. Psychologists have a name for it, and it's costing you hours.”"],
      rehooks: ["But here's the catch.", "The study found something nobody expected."],
      rules: ["Open with a relatable moment.", "Cite studies accurately; note replication issues.", "End with one practical action."],
      pitfalls: ["Overstating single studies.", "Pop-psych myths."],
      titles: ["Why You [common behaviour]", "The [effect] That Controls Your [habit]"],
      thumbnails: "Expressive face or relatable scene, 2–3 words.",
      research: [{ name: "Google Scholar", url: "https://scholar.google.com/" }],
      checks: [{ label: "References research (“study”, “researchers”)", pattern: "\\b(stud(y|ies)|research(ers)?|experiment|psychologists?)\\b", mustHave: true, why: "The audience trusts evidence." }],
    },
    {
      id: "general",
      name: "General / Other",
      tagline: "Use the core rules with no niche tuning.",
      style: "auto", template: "edu-story", wpm: 150, minutes: 8,
      audience: "Any audience.",
      wants: [], hooks: [], rehooks: [], rules: [], pitfalls: [], titles: [], thumbnails: "", research: [], checks: [],
    },
  ];

  function runChecks(niche, text) {
    if (!niche || !niche.checks) return [];
    return niche.checks.map((c) => {
      const re = new RegExp(c.pattern, c.caseSensitive ? "" : "i");
      const src = c.ignoreQuotes ? String(text || "").replace(/["“][^"”]*["”]/g, " ") : (text || "");
      const found = re.test(src);
      return { label: c.label, why: c.why, pass: c.mustHave ? found : !found };
    });
  }

  KB.NICHES = NICHES;
  KB.runNicheChecks = runChecks;
  if (typeof module !== "undefined" && module.exports) module.exports = KB;
})(typeof window !== "undefined" ? window : globalThis);
