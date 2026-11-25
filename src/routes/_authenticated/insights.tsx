import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, BarChart3, Brain, Flame, Gauge, Layers, Loader2, Target, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getInsights } from "@/lib/insights.functions";

export const Route = createFileRoute("/_authenticated/insights")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Study Intelligence — EduTwin AI" },
      {
        name: "description",
        content:
          "Premium analytics: retention curve, learning velocity, exam readiness score and your weakest topics ranked.",
      },
      { property: "og:title", content: "Study Intelligence — EduTwin AI" },
      {
        property: "og:description",
        content: "See retention, velocity and readiness from your real study data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-primary-glow" /> {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Insights() {
  const load = useServerFn(getInsights);
  const { data, isLoading, error } = useQuery({ queryKey: ["insights"], queryFn: () => load({}) });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Study Intelligence is a Premium surface</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Access could not be verified."}
          </p>
          <Button asChild className="mt-4 bg-neural">
            <Link to="/premium">Go to Premium</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const maxAcc = Math.max(100, ...data.trend.map((t) => t.accuracy));

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <header>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <BarChart3 className="size-3.5 text-accent" /> Study Intelligence
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            How your brain is <span className="text-gradient">actually trending</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Everything here is computed from your own lessons, tests, recall reviews and mistakes.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Target}
            label="Exam readiness"
            value={`${data.readiness}%`}
            hint={data.daysToExam != null ? `${data.daysToExam} days to exam` : "Set an exam date in onboarding"}
          />
          <Stat
            icon={Brain}
            label="Retention"
            value={`${data.retention}%`}
            hint={`${data.dueToday} cards due today of ${data.cardCount}`}
          />
          <Stat
            icon={Activity}
            label="Learning velocity"
            value={`${data.velocity}`}
            hint={`${data.lessonsDone} lessons finished · ${data.lessonsInProgress} in progress`}
          />
          <Stat
            icon={Gauge}
            label="Mock accuracy"
            value={`${data.avgAccuracy}%`}
            hint={
              data.accuracyDelta
                ? `${data.accuracyDelta > 0 ? "+" : ""}${data.accuracyDelta} pts vs earlier tests`
                : `${data.testCount} tests taken`
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <section className="panel p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Accuracy trend</p>
            {data.trend.length ? (
              <div className="mt-4 flex h-44 items-end gap-2">
                {data.trend.map((t, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-neural"
                      style={{ height: `${Math.max(6, (t.accuracy / maxAcc) * 100)}%` }}
                      title={`${t.topic}: ${t.accuracy}%`}
                    />
                    <span className="text-[10px] text-muted-foreground">{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Take a mock test and your trend line appears here.{" "}
                <Link to="/tests" className="text-primary-glow underline">
                  Start a test
                </Link>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Flame className="size-3.5 text-accent" /> {data.streak} day streak
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5" /> {data.noteCount} note packs
              </span>
              <span>Level {data.level} · {data.xp} XP</span>
              {data.bestPercentile ? <span>Best percentile {data.bestPercentile}</span> : null}
            </div>
          </section>

          <aside className="panel p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <TriangleAlert className="size-3.5 text-warning" /> Weakest topics
            </p>
            {data.weakTopics.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {data.weakTopics.map((w) => (
                  <li key={w.topic} className="flex items-center justify-between gap-3">
                    <span className="truncate">{w.topic}</span>
                    <span className="h-1.5 w-24 rounded-full bg-surface">
                      <span
                        className="block h-1.5 rounded-full bg-warning"
                        style={{ width: `${Math.min(100, w.weight * 25)}%` }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No weak spots detected yet — study a lesson or take a test.
              </p>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/planner">Rebuild my week around these</Link>
            </Button>
            {data.recentSessions.length ? (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Recent lessons
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {data.recentSessions.map((s, i) => (
                    <li key={i} className="truncate">
                      {s.completed ? "✓" : "•"} {s.topic}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
