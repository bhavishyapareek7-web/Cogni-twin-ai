export type Mastery = "mastered" | "improving" | "weak" | "untouched";

export type ConceptNode = {
  id: string;
  label: string;
  subject: string;
  mastery: Mastery;
  confidence: number;
  prereqs: string[];
};

export const knowledgeGenome: ConceptNode[] = [
  { id: "functions", label: "Functions", subject: "Math", mastery: "mastered", confidence: 92, prereqs: [] },
  { id: "limits", label: "Limits", subject: "Math", mastery: "weak", confidence: 34, prereqs: ["functions"] },
  {
    id: "continuity",
    label: "Continuity",
    subject: "Math",
    mastery: "improving",
    confidence: 58,
    prereqs: ["limits"],
  },
  {
    id: "differentiation",
    label: "Differentiation",
    subject: "Math",
    mastery: "improving",
    confidence: 61,
    prereqs: ["limits", "continuity"],
  },
  {
    id: "integration",
    label: "Integration",
    subject: "Math",
    mastery: "weak",
    confidence: 29,
    prereqs: ["differentiation"],
  },
  { id: "kinematics", label: "Kinematics", subject: "Physics", mastery: "mastered", confidence: 88, prereqs: [] },
  {
    id: "newton",
    label: "Newton's Laws",
    subject: "Physics",
    mastery: "mastered",
    confidence: 84,
    prereqs: ["kinematics"],
  },
  {
    id: "rotation",
    label: "Rotational Motion",
    subject: "Physics",
    mastery: "improving",
    confidence: 52,
    prereqs: ["newton"],
  },
  {
    id: "gravitation",
    label: "Gravitation",
    subject: "Physics",
    mastery: "weak",
    confidence: 31,
    prereqs: ["newton"],
  },
  {
    id: "blackholes",
    label: "Black Holes",
    subject: "Physics",
    mastery: "untouched",
    confidence: 0,
    prereqs: ["gravitation"],
  },
  { id: "goc", label: "GOC", subject: "Chemistry", mastery: "improving", confidence: 55, prereqs: [] },
  {
    id: "isomerism",
    label: "Isomerism",
    subject: "Chemistry",
    mastery: "weak",
    confidence: 27,
    prereqs: ["goc"],
  },
  {
    id: "reactions",
    label: "Name Reactions",
    subject: "Chemistry",
    mastery: "untouched",
    confidence: 0,
    prereqs: ["isomerism"],
  },
];

export const masteryLabel: Record<Mastery, string> = {
  mastered: "Mastered",
  improving: "Improving",
  weak: "Weak",
  untouched: "Never learned",
};

export const twinInsights = [
  {
    tag: "Attention",
    text: "You usually struggle with Integration after 30 minutes. Let's switch to a visual explanation.",
  },
  {
    tag: "Rhythm",
    text: "Your accuracy peaks between 6:40 and 9:10 AM. I moved Math practice into that window.",
  },
  {
    tag: "Memory",
    text: "Limits has been forgotten 3 times in 5 weeks. Scheduling an active-recall drill tonight.",
  },
  {
    tag: "Mood",
    text: "Typing speed dropped 22% and retries went up — you're fatigued. Take a 12-minute break.",
  },
];

export const twinStats = [
  { label: "Learning velocity", value: "1.4x", detail: "vs. your 30-day baseline" },
  { label: "Retention", value: "71%", detail: "7-day forgetting curve" },
  { label: "Focus span", value: "32 min", detail: "before accuracy drops" },
  { label: "Brain score", value: "78", detail: "fresh — good to push hard" },
];

export const examPrediction = {
  current: 178,
  expected: 195,
  band: 8,
  airLow: 5200,
  airHigh: 6400,
  iitProbability: 74,
  strongest: "Physics — Mechanics",
  weakest: "Math — Calculus",
  upside: 41,
};

export const strategy = {
  verdict: "Your current plan is under-performing by 9 marks. Here's the rewrite.",
  moves: [
    { move: "Reduce Physics drilling", delta: "-20%", why: "Already above target accuracy" },
    { move: "Increase Organic Chemistry", delta: "+35%", why: "Highest marks-per-hour right now" },
    { move: "Morning Math practice", delta: "6:40 AM", why: "Your peak accuracy window" },
    { move: "Night revision block", delta: "25 min", why: "Best consolidation before sleep" },
  ],
  improvement: 17,
};

export const agents = [
  { name: "Tutor AI", role: "Explains any concept, your way", icon: "GraduationCap" },
  { name: "Exam Coach", role: "Paper strategy and mock analysis", icon: "Target" },
  { name: "Motivator", role: "Keeps the streak alive", icon: "Flame" },
  { name: "Memory Coach", role: "Spaced repetition scheduling", icon: "Brain" },
  { name: "Research Assistant", role: "Papers, citations, summaries", icon: "FlaskConical" },
  { name: "Career Advisor", role: "Skills, colleges, salary paths", icon: "Compass" },
  { name: "Coding Mentor", role: "Reviews and debugs your code", icon: "Code2" },
  { name: "Interview Coach", role: "Mock interviews with feedback", icon: "Mic" },
];

export type Slide = {
  title: string;
  bullets: string[];
  visual: string;
  narration: string;
};

export const lesson = {
  topic: "Anatomy of a Black Hole",
  subject: "Physics · Gravitation",
  slides: [
    {
      title: "What is a black hole?",
      bullets: [
        "A region where gravity is so intense that escape velocity exceeds the speed of light.",
        "Formed when a massive star collapses under its own weight.",
        "Defined entirely by three numbers: mass, spin and charge.",
      ],
      visual: "Collapsing star → singularity",
      narration:
        "Imagine squeezing the entire Sun into a city the size of Mumbai. That is the kind of density we're talking about.",
    },
    {
      title: "The Event Horizon",
      bullets: [
        "The spherical boundary where escape velocity equals the speed of light.",
        "Nothing that crosses it — not even light — can return.",
        "Its radius is the Schwarzschild radius, r = 2GM/c².",
      ],
      visual: "Sphere of no return",
      narration:
        "Think of a waterfall. Past a certain point the current is faster than you can swim. That point is the event horizon.",
    },
    {
      title: "The Singularity",
      bullets: [
        "At the very centre lies the singularity, where matter is crushed to a point of infinite density.",
        "Our current physics stops making predictions here.",
        "Quantum gravity is the missing piece.",
      ],
      visual: "Infinite density point",
      narration:
        "This is where general relativity throws up its hands and says: I don't know what happens next.",
    },
    {
      title: "The Photon Sphere",
      bullets: [
        "A region outside the horizon where gravity is strong enough to force light into circular orbits.",
        "Sits at 1.5 times the Schwarzschild radius.",
        "It creates the glowing ring you see in black hole images.",
      ],
      visual: "Light bending into orbit",
      narration:
        "Light itself goes into orbit here. In principle you could see the back of your own head.",
    },
  ] satisfies Slide[],
};

export const lessonQuiz = {
  question: "If a black hole's mass doubles, its Schwarzschild radius…",
  options: ["Stays the same", "Doubles", "Quadruples", "Halves"],
  answerIndex: 1,
  explanation: "r = 2GM/c² is linear in M, so doubling the mass doubles the radius.",
};
