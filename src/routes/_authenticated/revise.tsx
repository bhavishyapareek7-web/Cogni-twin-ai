import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Layers, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  awardXp,
  generateStudyPack,
  getTwin,
  listStudyPacks,
  reviewCard,
} from "@/lib/twin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/revise")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Notes, Flashcards & Spaced Revision — EduTwin AI" },
      {
        name: "description",
        content:
          "Generate revision notes, formula sheets and mnemonics on any topic, then review AI flashcards on a neuroscience-based spaced schedule.",
      },
      { property: "og:title", content: "Notes, Flashcards & Spaced Revision — EduTwin AI" },
      {
        property: "og:description",
        content: "AI notes plus spaced-repetition flashcards that follow your forgetting curve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Revise,
});

const KINDS = [
  { id: "notes", label: "Revision notes" },
  { id: "formula_sheet", label: "Formula sheet" },
  { id: "mnemonics", label: "Memory tricks" },
  { id: "mind_map", label: "Mind map" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

function Revise() {
  const qc = useQueryClient();
  const make = useServerFn(generateStudyPack);
  const review = useServerFn(reviewCard);
  const xp = useServerFn(awardXp);
  const loadTwin = useServerFn(getTwin);
  const loadPacks = useServerFn(listStudyPacks);

  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<Kind>("notes");
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const twin = useQuery({ queryKey: ["twin"], queryFn: () => loadTwin({}) });
  const packs = useQuery({ queryKey: ["packs"], queryFn: () => loadPacks({}) });

  const due = twin.data?.dueCards ?? [];
  const card = due[cardIndex];

  const packMutation = useMutation({
    mutationFn: () => make({ data: { topic: topic.trim(), kind } }),
    onSuccess: (res) => {
      toast.success(`Pack ready — ${res.cards} flashcards scheduled.`);
      setTopic("");
      void xp({ data: { amount: 20, reason: "generated a study pack" } });
      void qc.invalidateQueries({ queryKey: ["packs"] });
      void qc.invalidateQueries({ queryKey: ["twin"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't build that pack."),
  });

  const reviewMutation = useMutation({
    mutationFn: (quality: 0 | 1 | 2) => review({ data: { id: card!.id, quality } }),
    onSuccess: () => {
      setFlipped(false);
      if (cardIndex + 1 >= due.length) {
        void xp({ data: { amount: 25, reason: "cleared a revision session" } });
        void qc.invalidateQueries({ queryKey: ["twin"] });
        setCardIndex(0);
        toast.success("Session cleared — your twin updated your forgetting curve.");
      } else {
        setCardIndex((i) => i + 1);
      }
    },
    onError: () => toast.error("Couldn't save that review."),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Layers className="size-3.5" /> Memory optimizer
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Notes that turn into <span className="text-gradient">timed recall</span>
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="panel space-y-3 p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="size-3.5" /> Generate a pack
            </p>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (topic.trim().length < 2) {
                  toast.error("Give a topic first.");
                  return;
                }
                packMutation.mutate();
              }}
            >
              <Input
                value={topic}
                maxLength={120}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Thermodynamics — first law"
                className="bg-background"
              />
              <Button type="submit" className="bg-neural" disabled={packMutation.isPending}>
                {packMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <BookOpen className="mr-2 size-4" />
                )}
                Generate
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    kind === k.id
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel flex flex-col p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Due today · {due.length}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void qc.invalidateQueries({ queryKey: ["twin"] })}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            {card ? (
              <div className="mt-3 flex flex-1 flex-col">
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  className="min-h-40 flex-1 rounded-2xl border border-border bg-surface p-5 text-left"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {card.topic}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed">{card.front}</p>
                  {flipped && (
                    <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-accent">
                      {card.back}
                    </p>
                  )}
                  {!flipped && (
                    <p className="mt-4 text-xs text-muted-foreground">Tap to reveal</p>
                  )}
                </button>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(
                    [
                      { q: 0, label: "Forgot" },
                      { q: 1, label: "Hard" },
                      { q: 2, label: "Easy" },
                    ] as const
                  ).map((b) => (
                    <Button
                      key={b.q}
                      size="sm"
                      variant={b.q === 2 ? "default" : "outline"}
                      className={b.q === 2 ? "bg-neural" : ""}
                      disabled={!flipped || reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate(b.q)}
                    >
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Nothing due — generate a pack and your twin will schedule the recall.
              </p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your library</p>
          {packs.data?.length ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {packs.data.map((n) => (
                <article key={n.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {n.kind.replace("_", " ")} · {n.topic}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">{n.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                    {n.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No packs yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
