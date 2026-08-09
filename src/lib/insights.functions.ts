import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireFeature } from "@/lib/access.server";

/** Premium analytics: retention, learning velocity and readiness, computed server-side. */
export const getInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireFeature(supabase, userId, "premium_analytics");
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, testsRes, cardsRes, sessionsRes, notesRes, memoryRes] = await Promise.all([
      supabase.from("profiles").select("xp, level, streak_days, exam_date, target_exams").eq("id", userId).maybeSingle(),
      supabase
        .from("mock_tests")
        .select("exam, topic, accuracy, predicted_percentile, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("flashcards").select("ease, interval_days, due_on, reviews, topic"),
      supabase.from("lesson_sessions").select("topic, completed, slide_index, updated_at").order("updated_at", { ascending: false }).limit(50),
      supabase.from("notes").select("id, kind, created_at"),
      supabase.from("twin_memory").select("kind, topic, note, created_at").order("created_at", { ascending: false }).limit(30),
    ]);

    const tests = testsRes.data ?? [];
    const cards = cardsRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const memory = memoryRes.data ?? [];

    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const accuracies = tests.map((t) => Number(t.accuracy));
    const recent = avg(accuracies.slice(0, 5));
    const older = avg(accuracies.slice(5, 10));

    const reviewed = cards.filter((c) => c.reviews > 0);
    const retention = reviewed.length
      ? Math.round(avg(reviewed.map((c) => Math.min(100, (Number(c.ease) - 1.3) / 1.9 * 100))))
      : 0;

    const dueToday = cards.filter((c) => c.due_on <= today).length;
    const lessonsDone = sessions.filter((s) => s.completed).length;
    const velocity = Math.round((lessonsDone * 2 + reviewed.length * 0.5 + tests.length * 3) * 10) / 10;

    // Topic-level weak spots from mistakes + low-ease cards.
    const weakMap = new Map<string, number>();
    for (const m of memory.filter((m) => m.kind === "mistake" && m.topic)) {
      weakMap.set(m.topic as string, (weakMap.get(m.topic as string) ?? 0) + 2);
    }
    for (const c of cards.filter((c) => Number(c.ease) < 2.3)) {
      weakMap.set(c.topic, (weakMap.get(c.topic) ?? 0) + 1);
    }
    const weakTopics = [...weakMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, weight]) => ({ topic, weight }));

    const examDate = profileRes.data?.exam_date ?? null;
    const daysToExam = examDate
      ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000))
      : null;

    const readiness = Math.round(
      Math.min(
        100,
        recent * 0.55 + retention * 0.25 + Math.min(100, lessonsDone * 6) * 0.2,
      ),
    );

    return {
      xp: profileRes.data?.xp ?? 0,
      level: profileRes.data?.level ?? 1,
      streak: profileRes.data?.streak_days ?? 0,
      targetExams: profileRes.data?.target_exams ?? [],
      daysToExam,
      readiness,
      retention,
      velocity,
      dueToday,
      cardCount: cards.length,
      lessonsDone,
      lessonsInProgress: sessions.filter((s) => !s.completed).length,
      noteCount: notesRes.data?.length ?? 0,
      testCount: tests.length,
      avgAccuracy: Math.round(recent),
      accuracyDelta: older ? Math.round(recent - older) : 0,
      bestPercentile: tests.length
        ? Math.max(...tests.map((t) => Number(t.predicted_percentile ?? 0)))
        : 0,
      trend: tests
        .slice(0, 10)
        .reverse()
        .map((t) => ({
          label: new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          topic: t.topic,
          accuracy: Math.round(Number(t.accuracy)),
        })),
      weakTopics,
      recentSessions: sessions.slice(0, 6).map((s) => ({
        topic: s.topic,
        completed: s.completed,
        slide: s.slide_index,
      })),
    };
  });
