import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, Clock3, ListChecks, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export type ExamLandingProps = {
  eyebrow: string;
  title: string;
  intro: string;
  exam: "JEE Main" | "NEET UG" | "CUET UG";
  cta: string;
  pattern: Array<[string, string]>;
  steps: string[];
  faqs: Array<{ q: string; a: string }>;
  related?: Array<{
    title: string;
    body: string;
    to: string;
    exam?: "JEE Main" | "NEET UG" | "CUET UG";
  }>;
};

export function ExamLanding({
  eyebrow,
  title,
  intro,
  exam,
  cta,
  pattern,
  steps,
  faqs,
  related = [],
}: ExamLandingProps) {
  return (
    <AppShell>
      <article className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{intro}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-13 bg-neural text-base font-semibold glow">
            <Link to="/tests" search={{ exam }}>
              {cta} <ArrowRight className="ml-1 size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-13 text-base">
            <Link to="/classroom">Learn a chapter first</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Sign in free to save your score, explanations, weak chapters and progress.
        </p>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">Every attempt ends with a useful next step</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Target,
                title: "Instant result",
                body: "See your marks, accuracy, attempted and skipped questions as soon as you submit.",
              },
              {
                icon: BookOpenCheck,
                title: "Question explanations",
                body: "Review the correct option and a concise explanation for every question, including mistakes.",
              },
              {
                icon: TrendingUp,
                title: "Readiness estimate",
                body: "Track an estimated percentile and rank band across attempts; these are guidance, not official NTA results.",
              },
              {
                icon: ListChecks,
                title: "Weak-topic repair",
                body: "The subtopics behind wrong answers are flagged for revision and future practice.",
              },
            ].map((feature) => (
              <div key={feature.title} className="panel p-5">
                <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/15">
                  <feature.icon className="size-5 text-primary-glow" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold">Choose your NTA examination</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.exam ? { exam: item.exam } : {}}
                  className="panel block p-5 transition-colors hover:border-primary/50"
                >
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  <span className="mt-4 flex items-center gap-1 text-sm text-primary-glow">
                    Explore <ArrowRight className="size-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="panel p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Clock3 className="size-5 text-accent" /> Paper pattern at a glance
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              {pattern.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Always confirm the current pattern in the official NTA information bulletin for your examination year.
            </p>
          </div>

          <div className="panel p-6">
            <h2 className="text-xl font-semibold">How to take your first mock</h2>
            <ol className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent/40 text-xs text-accent">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">Mock test FAQs</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="panel p-5">
                <summary className="cursor-pointer text-sm font-semibold">{faq.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="panel mt-14 p-6 text-center">
          <h2 className="text-xl font-semibold">Ready to see your result?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Generate a fresh paper, submit your answers and review every explanation.
          </p>
          <Button asChild size="lg" className="mt-5 bg-neural font-semibold">
            <Link to="/tests" search={{ exam }}>
              {cta} <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </section>
      </article>
    </AppShell>
  );
}
