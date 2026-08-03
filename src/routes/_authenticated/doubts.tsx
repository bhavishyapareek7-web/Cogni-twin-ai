import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Lightbulb, Loader2, ScanLine, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { awardXp, solveDoubt } from "@/lib/twin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/doubts")({
  head: () => ({
    meta: [
      { title: "AI Doubt Solver — EduTwin AI" },
      {
        name: "description",
        content:
          "Paste or scan any question and get hint-first, step-by-step coaching instead of a copied answer.",
      },
      { property: "og:title", content: "AI Doubt Solver — EduTwin AI" },
      {
        property: "og:description",
        content: "Hint-first step-by-step homework coaching from your AI twin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Doubts,
});

type Solution = {
  restated: string;
  steps: Array<{ title: string; detail: string }>;
  answer: string;
  pitfall: string;
  concept: string;
};

function Doubts() {
  const solve = useServerFn(solveDoubt);
  const xp = useServerFn(awardXp);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"hints" | "full">("hints");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [open, setOpen] = useState(0);

  const mutation = useMutation({
    mutationFn: (m: "hints" | "full") => solve({ data: { question: question.trim(), mode: m } }),
    onSuccess: (res) => {
      setSolution(res);
      setOpen(0);
      void xp({ data: { amount: 15, reason: "solved a doubt" } });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't work that one out — rephrase it?"),
  });

  const run = (m: "hints" | "full") => {
    if (question.trim().length < 3) {
      toast.error("Type or paste your question first.");
      return;
    }
    setMode(m);
    mutation.mutate(m);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Lightbulb className="size-3.5" /> Doubt solver
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Stuck? Get <span className="text-gradient">hints, not answers</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your twin coaches you through it step by step, then logs the concept so revision picks it
            up later.
          </p>
        </div>

        <div className="panel space-y-3 p-5">
          <Textarea
            value={question}
            maxLength={2000}
            rows={5}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Paste a question — e.g. A block of 2 kg slides down a 30° incline with μ = 0.2. Find its acceleration."
            className="resize-none bg-background"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button className="bg-neural" disabled={mutation.isPending} onClick={() => run("hints")}>
              {mutation.isPending && mode === "hints" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 size-4" />
              )}
              Guide me with hints
            </Button>
            <Button variant="outline" disabled={mutation.isPending} onClick={() => run("full")}>
              {mutation.isPending && mode === "full" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Show full solution
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Camera scan is coming next — paste the question text for now.")
              }
            >
              <Camera className="mr-2 size-4" /> Scan
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ScanLine className="size-3.5" /> Works for numericals, theory, essays and code.
          </p>
        </div>

        {solution && (
          <div className="panel space-y-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {solution.concept}
              </p>
              <h2 className="mt-1 text-base font-semibold">{solution.restated}</h2>
            </div>
            <ol className="space-y-2">
              {solution.steps.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border bg-surface">
                  <button
                    type="button"
                    onClick={() => setOpen(open === i ? -1 : i)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{s.title}</span>
                  </button>
                  <p
                    className={cn(
                      "px-4 pb-3 text-sm leading-relaxed text-foreground/80",
                      open !== i && "hidden",
                    )}
                  >
                    {s.detail}
                  </p>
                </li>
              ))}
            </ol>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">
              <span className="font-semibold">Answer: </span>
              {solution.answer}
            </div>
            <p className="rounded-xl border border-weak/40 bg-weak/10 p-3 text-sm leading-relaxed">
              <span className="font-semibold">Common trap: </span>
              {solution.pitfall}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
