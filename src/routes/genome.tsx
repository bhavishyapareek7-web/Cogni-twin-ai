import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { knowledgeGenome, masteryLabel, type ConceptNode, type Mastery } from "@/lib/twin-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/genome")({
  head: () => ({
    meta: [
      { title: "Knowledge DNA — EduTwin AI" },
      {
        name: "description",
        content:
          "Your visual knowledge genome: every concept a node, colour-coded by mastery, wired by prerequisite dependencies.",
      },
      { property: "og:title", content: "Knowledge DNA — EduTwin AI" },
      {
        property: "og:description",
        content: "Concept nodes coloured by mastery, with prerequisite chains your twin repairs first.",
      },
    ],
  }),
  component: Genome,
});

const masteryClasses: Record<Mastery, string> = {
  mastered: "border-mastered/50 bg-mastered/15 text-mastered",
  improving: "border-improving/50 bg-improving/15 text-improving",
  weak: "border-weak/50 bg-weak/15 text-weak",
  untouched: "border-untouched/60 bg-untouched/15 text-muted-foreground",
};

const dotClasses: Record<Mastery, string> = {
  mastered: "bg-mastered",
  improving: "bg-improving",
  weak: "bg-weak",
  untouched: "bg-untouched",
};

function Genome() {
  const [selectedId, setSelectedId] = useState<string>("integration");
  const byId = useMemo(
    () => Object.fromEntries(knowledgeGenome.map((n) => [n.id, n])) as Record<string, ConceptNode>,
    [],
  );
  const selected = byId[selectedId];

  const chain = useMemo(() => {
    const out: ConceptNode[] = [];
    const walk = (id: string) => {
      const node = byId[id];
      if (!node || out.some((n) => n.id === id)) return;
      node.prereqs.forEach(walk);
      out.push(node);
    };
    walk(selectedId);
    return out;
  }, [selectedId, byId]);

  const blockers = chain.filter((n) => n.id !== selectedId && n.confidence < 50);
  const subjects = [...new Set(knowledgeGenome.map((n) => n.subject))];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <header>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Knowledge DNA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every concept is a node. Your twin repairs broken prerequisites before it lets you move on.
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(masteryLabel) as Mastery[]).map((m) => (
            <span
              key={m}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs"
            >
              <span className={cn("size-2 rounded-full", dotClasses[m])} />
              {masteryLabel[m]}
            </span>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="panel space-y-6 p-6">
            {subjects.map((subject) => (
              <div key={subject}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{subject}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {knowledgeGenome
                    .filter((n) => n.subject === subject)
                    .map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedId(n.id)}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-left text-sm transition-all hover:-translate-y-0.5",
                          masteryClasses[n.mastery],
                          selectedId === n.id && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                        )}
                      >
                        <span className="block font-semibold">{n.label}</span>
                        <span className="text-[11px] opacity-80">{n.confidence}% confidence</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </section>

          <section className="panel p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Dependency chain</p>
            <h2 className="mt-1 text-xl font-black">{selected.label}</h2>

            <ol className="mt-5 space-y-2">
              {chain.map((n, i) => (
                <li
                  key={n.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 p-3"
                  style={{ marginLeft: `${i * 12}px` }}
                >
                  <span className={cn("size-2.5 shrink-0 rounded-full", dotClasses[n.mastery])} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{n.confidence}%</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm leading-relaxed">
              {blockers.length ? (
                <>
                  <span className="font-semibold text-primary-glow">Twin recommendation · </span>
                  {blockers.map((b) => b.label).join(" and ")}{" "}
                  {blockers.length > 1 ? "are" : "is"} holding {selected.label} back. Relearn{" "}
                  {blockers[0].label} first — expected lift of{" "}
                  {Math.max(12, 60 - blockers[0].confidence)} points on {selected.label}.
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary-glow">Twin recommendation · </span>
                  Foundations are solid. Push straight into timed practice on {selected.label}.
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
