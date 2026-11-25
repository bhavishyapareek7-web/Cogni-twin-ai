import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookOpen, Flame, Heart, Link2, Loader2, Sparkles, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getParentOverview, linkChild } from "@/lib/family.functions";

export const Route = createFileRoute("/_authenticated/parent")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Parent Dashboard — EduTwin AI" },
      {
        name: "description",
        content:
          "Follow your child's learning journey: lessons completed, mock test scores, streaks and study points on EduTwin AI.",
      },
      { property: "og:title", content: "Parent Dashboard — EduTwin AI" },
      {
        property: "og:description",
        content: "See your child's lessons, test scores and study streaks at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const queryClient = useQueryClient();
  const loadOverview = useServerFn(getParentOverview);
  const link = useServerFn(linkChild);
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["parent-overview"],
    queryFn: () => loadOverview({}),
  });

  const linkMutation = useMutation({
    mutationFn: (childEmail: string) => link({ data: { email: childEmail } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Child linked to your account");
        setEmail("");
        void queryClient.invalidateQueries({ queryKey: ["parent-overview"] });
        void queryClient.invalidateQueries({ queryKey: ["access"] });
      } else {
        toast.error(result.reason ?? "Could not link that account");
      }
    },
    onError: () => toast.error("Could not link that account"),
  });

  const children = data?.children ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-neural glow">
            <Heart className="size-5 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Follow your child's learning without hovering over their shoulder.
            </p>
          </div>
        </div>

        <div className="panel mb-6 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4 text-accent" /> Link a child
          </h2>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) linkMutation.mutate(email.trim());
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your child's login email"
              className="flex-1"
            />
            <Button type="submit" className="bg-neural" disabled={linkMutation.isPending}>
              {linkMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Link child
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : children.length === 0 ? (
          <div className="panel grid place-items-center gap-2 py-16 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="font-medium">No children linked yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask your child to create an EduTwin AI account, then link it above with their login
              email.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <section key={child.studentId} className="panel p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{child.name}</h2>
                    {child.examGoal && (
                      <p className="text-sm text-muted-foreground">Goal: {child.examGoal}</p>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Flame className="size-4 text-accent" /> {child.streakDays} day streak
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-4 text-accent" /> {child.points} points
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="size-4 text-accent" /> Level {child.level}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <BookOpen className="size-4" /> Recent lessons
                    </h3>
                    {child.lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No lessons yet.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {child.lessons.slice(0, 5).map((l, i) => (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="truncate">{l.topic}</span>
                            <span
                              className={
                                l.completed ? "text-accent" : "text-muted-foreground"
                              }
                            >
                              {l.completed ? "Done" : "In progress"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Target className="size-4" /> Recent mock tests
                    </h3>
                    {child.tests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tests yet.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {child.tests.slice(0, 5).map((t, i) => (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="truncate">{t.topic}</span>
                            <span className="font-medium">
                              {t.score}/{t.total}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
