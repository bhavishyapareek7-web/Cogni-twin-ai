import { createFileRoute } from "@tanstack/react-router";
import { ExamLanding } from "@/components/ExamLanding";

const title = "NTA Mock Tests — JEE, NEET & CUET Practice with Solutions";
const description =
  "Practise NTA-style JEE Main, NEET UG and CUET UG mock tests with timers, exam-specific marking, instant results and question-by-question explanations.";

const faqs = [
  {
    q: "Which NTA exams are covered?",
    a: "You can open dedicated practice for JEE Main, NEET UG and CUET UG. The mock engine also lets you type a topic and generate a fresh paper for your chosen exam.",
  },
  {
    q: "Does the marking change by examination?",
    a: "Yes. JEE Main and NEET UG practice use +4/−1, while CUET UG uses +5/−1. Skipped questions receive zero. Always verify your exam-year bulletin.",
  },
  {
    q: "Are results and explanations included?",
    a: "Yes. Submission shows marks, accuracy, an estimated percentile and rank band, the correct answers, explanations and weak subtopics.",
  },
  {
    q: "Are these official NTA papers or scores?",
    a: "No. Questions are AI-generated practice and all predictions are estimates. They are not official NTA question papers, scores, percentiles or ranks.",
  },
];

export const Route = createFileRoute("/nta-mock-test")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/nta-mock-test" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }),
      },
    ],
  }),
  component: NtaMockTest,
});

function NtaMockTest() {
  return (
    <ExamLanding
      eyebrow="NTA examination preparation"
      title="NTA mock tests for JEE, NEET and CUET — with results and solutions"
      intro="Choose your examination and generate a fresh, timed practice paper. EduTwin AI applies the selected exam's marking scheme, then gives you a clear result, question-by-question explanations and a focused list of what to revise."
      exam="JEE Main"
      cta="Start an NTA mock test"
      related={[
        {
          title: "JEE Main",
          body: "Physics, Chemistry and Mathematics practice with +4/−1 marking and rank estimates.",
          to: "/jee-mock-test",
        },
        {
          title: "NEET UG",
          body: "Generate Biology, Physics and Chemistry papers from the main mock-test engine.",
          to: "/tests",
          exam: "NEET UG",
        },
        {
          title: "CUET UG",
          body: "Language, domain-subject and General Test practice with +5/−1 scoring.",
          to: "/cuet-mock-test",
        },
      ]}
      pattern={[
        ["Examinations", "JEE Main, NEET UG and CUET UG"],
        ["JEE & NEET marking", "+4 correct, −1 wrong, 0 skipped"],
        ["CUET marking", "+5 correct, −1 wrong, 0 skipped"],
        ["Practice format", "Timed single-correct MCQs"],
        ["Results", "Instant, with explanations and weak-topic analysis"],
      ]}
      steps={[
        "Choose JEE Main, NEET UG or CUET UG and sign in free.",
        "Enter a chapter or subject and select your preferred difficulty.",
        "Attempt the generated paper against the timer.",
        "Submit to see exam-specific scoring and your readiness estimate.",
        "Read each explanation and revisit the weak subtopics before another attempt.",
      ]}
      faqs={faqs}
    />
  );
}
