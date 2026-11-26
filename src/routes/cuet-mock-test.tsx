import { createFileRoute } from "@tanstack/react-router";
import { ExamLanding } from "@/components/ExamLanding";

const title = "CUET UG Mock Test — Free Practice with Results & Explanations";
const description =
  "Take AI-generated CUET UG mock tests with +5/−1 marking, instant results, estimated percentile, question explanations and weak-topic analysis.";

const faqs = [
  {
    q: "Does this CUET mock test use negative marking?",
    a: "Yes. EduTwin AI scores CUET UG practice at +5 for each correct answer, −1 for each wrong answer and 0 for skipped questions. Confirm your exam-year rules in the official bulletin.",
  },
  {
    q: "Will I see explanations after submitting?",
    a: "Yes. The result screen reveals the correct option and an explanation for every question, along with your score, accuracy and weak subtopics.",
  },
  {
    q: "Which CUET subjects can I practise?",
    a: "You can enter a language, domain-subject or General Test topic and choose the difficulty and number of questions for a focused practice paper.",
  },
  {
    q: "Is the predicted percentile an official NTA result?",
    a: "No. It is a practice estimate based on this attempt. NTA calculates official scores and percentiles using its own examination and normalisation process.",
  },
];

export const Route = createFileRoute("/cuet-mock-test")({
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
    links: [{ rel: "canonical", href: "/cuet-mock-test" }],
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
  component: CuetMockTest,
});

function CuetMockTest() {
  return (
    <ExamLanding
      eyebrow="CUET UG preparation"
      title="CUET UG mock tests with instant results and explanations"
      intro="Build a fresh CUET UG practice paper for a language, domain subject or the General Test. Submit against the timer to see your marks, accuracy, estimated percentile, every solution and the exact subtopics to revise next."
      exam="CUET UG"
      cta="Start a CUET mock test"
      pattern={[
        ["Sections", "Languages, domain subjects and General Test"],
        ["Marking", "+5 correct, −1 wrong, 0 skipped"],
        ["Duration", "Depends on the selected paper"],
        ["Total marks", "Depends on the number of questions"],
        ["Mode", "Computer-based test"],
      ]}
      steps={[
        "Sign in free and open the CUET UG test setup.",
        "Enter a subject or chapter, then choose your question count and difficulty.",
        "Attempt the paper against the timer; skipped questions receive zero.",
        "Submit for your +5/−1 score, accuracy and readiness estimate.",
        "Review every answer explanation and repair the weak topics flagged by your twin.",
      ]}
      faqs={faqs}
    />
  );
}
