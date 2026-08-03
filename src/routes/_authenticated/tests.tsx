import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { awardXp, generateMockTest, getTwin, submitMockTest } from "@/lib/twin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tests")({
  head: () => ({
    meta: [
      { title: "Mock Test Engine & Rank Prediction — EduTwin AI" },
      {
        name: "description",
        content:
          "AI-generated mock tests with timer, negative marking, auto evaluation, weak-area detection and percentile plus rank prediction.",
      },
      { property: "og:title", content: "Mock Test Engine & Rank Prediction — EduTwin AI" },
      {
        property: "og:description",
        content: "Timed AI mock tests with instant percentile and rank prediction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tests,
});

const EXAMS = ["JEE", "NEET", "CBSE Boards", "UPSC", "CAT", "SAT"];
const LEVELS = ["easy", "medium", "hard", "exam", "olympiad"] as const;

type Question = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  subtopic: string;
};

function Tests() {
  const qc = useQueryClient();
  const build = useServerFn(generateMockTest);
  const submit = useServerFn(submitMockTest);
  const xp = useServerFn(awardXp);
  const loadTwin = useServerFn(getTwin);
  const twin = useQuery({ queryKey: ["twin"], queryFn: () => loadTwin({}) });

  const [exam, setExam] = useState("JEE");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("exam");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    accuracy: number;
    percentile: number;
    rankLow: number;
    rankHigh: number;
    weak: string[];
  } | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const buildMutation = useMutation({
    mutationFn: () =>
      build({ data: { exam, topic: topic.trim(), count, difficulty: level } }),
    onSuccess: (res) => {
      setQuestions(res.questions);
      setAnswers({});
      setResult(null);
      setSeconds(0);
      setRunning(true);
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't build that test."),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: {
      correct: number;
      wrong: number;
      skipped: number;
      weakSubtopics: string[];
    }) =>
      submit({
        data: {
          exam,
          topic: topic.trim() || "Mixed",
          correct: payload.correct,
          wrong: payload.wrong,
          skipped: payload.skipped,
          seconds,
          weakSubtopics: payload.weakSubtopics,
        },
      }),
    onSuccess: (row) => {
      setRunning(false);
      setResult({
        score: Number(row.score),
        total: Number(row.total),
        accuracy: Number(row.accuracy),
        percentile: Number(row.predicted_percentile ?? 0),
        rankLow: row.rank_low ?? 0,
        rankHigh: row.rank_high ?? 0,
        weak: ((row.analysis as { weakSubtopics?: string[] })?.weakSubtopics ?? []) as string[],
      });
      void xp({ data: { amount: 40, reason: "completed a mock test" } });
      void qc.invalidateQueries({ queryKey: ["twin"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't evaluate that attempt."),
  });

  const finish = () => {
    if (!questions) return;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const weak: string[] = [];
    questions.forEach((q, i) => {
      const a = answers[i];
      if (a === undefined) skipped += 1;
      else if (a === q.answerIndex) correct += 1;
      else {
        wrong += 1;
        weak.push(q.subtopic);
      }
    });
    submitMutation.mutate({ correct, wrong, skipped, weakSubtopics: weak });
  };

  const history = twin.data?.tests ?? [];
  const clock = useMemo(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [seconds]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Target className="size-3.5" /> Mock test engine
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Test, then see your <span className="text-gradient">predicted rank</span>
          </h1>
        </div>

        <div className="panel space-y-3 p-5">
          <div className="flex flex-wrap gap-2">
            {EXAMS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setExam(e)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  exam === e
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (topic.trim().length < 2) {
                toast.error("Which topic should the test cover?");
                return;
              }
              buildMutation.mutate();
            }}
          >
            <Input
              value={topic}
              maxLength={120}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic — e.g. Rotational motion"
              className="bg-background"
            />
            <Input
              value={count}
              type="number"
              min={3}
              max={15}
              onChange={(e) => setCount(Number(e.target.value) || 5)}
              className="bg-background sm:w-24"
            />
            <Button type="submit" className="bg-neural" disabled={buildMutation.isPending}>
              {buildMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Building…
                </>
              ) : (
                "Start test"
              )}
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                  level === l
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              +4 correct · −1 wrong · negative marking on
            </span>
          </div>
        </div>

        {questions && (
          <div className="panel space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {exam} · {topic}
              </p>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
                <Clock className="size-3.5" /> {clock}
              </span>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const chosen = answers[i] === oi;
                    const correct = oi === q.answerIndex;
                    const done = !!result;
                    return (
                      <button
                        key={o}
                        type="button"
                        disabled={done}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                          !done && chosen && "border-primary bg-primary/15",
                          !done && !chosen && "border-border hover:border-primary/50",
                          done && correct && "border-mastered/50 bg-mastered/15",
                          done && chosen && !correct && "border-weak/50 bg-weak/15",
                          done && !chosen && !correct && "border-border opacity-60",
                        )}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {result && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {q.subtopic} — {q.explanation}
                  </p>
                )}
              </div>
            ))}
            {!result && (
              <Button
                className="w-full bg-neural"
                disabled={submitMutation.isPending}
                onClick={finish}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Evaluating…
                  </>
                ) : (
                  "Submit & predict my rank"
                )}
              </Button>
            )}
          </div>
        )}

        {result && (
          <div className="panel grid gap-4 p-5 sm:grid-cols-4">
            {[
              { label: "Score", value: `${result.score} / ${result.total}` },
              { label: "Accuracy", value: `${result.accuracy}%` },
              { label: "Predicted percentile", value: `${result.percentile}` },
              {
                label: "Rank band",
                value: `${result.rankLow.toLocaleString()}–${result.rankHigh.toLocaleString()}`,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-lg font-bold">{s.value}</p>
              </div>
            ))}
            {result.weak.length > 0 && (
              <div className="sm:col-span-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Twin flagged these for repair
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.weak.map((w, i) => (
                    <span
                      key={`${w}-${i}`}
                      className="rounded-full border border-weak/40 bg-weak/10 px-3 py-1 text-xs"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="panel p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="size-3.5" /> Recent attempts
            </p>
            <div className="mt-3 space-y-2">
              {history.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
                >
                  <span className="font-medium">
                    {t.exam} · {t.topic}
                  </span>
                  <span className="text-muted-foreground">
                    {Number(t.score)}/{Number(t.total)} · {Number(t.accuracy)}% · %ile{" "}
                    {Number(t.predicted_percentile ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
