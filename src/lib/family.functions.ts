import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StudentProgress = {
  studentId: string;
  name: string;
  examGoal: string | null;
  xp: number;
  level: number;
  streakDays: number;
  points: number;
  lessons: Array<{ topic: string; subject: string; completed: boolean; updatedAt: string }>;
  tests: Array<{ exam: string; topic: string; score: number; total: number; createdAt: string }>;
};

async function progressFor(
  admin: Awaited<ReturnType<typeof importAdmin>>,
  studentId: string,
): Promise<StudentProgress> {
  const [profileRes, lessonsRes, testsRes, pointsRes] = await Promise.all([
    admin.from("profiles").select("display_name, exam_goal, xp, level, streak_days").eq("id", studentId).maybeSingle(),
    admin
      .from("lesson_sessions")
      .select("topic, subject, completed, updated_at")
      .eq("user_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(10),
    admin
      .from("mock_tests")
      .select("exam, topic, score, total, created_at")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("point_ledger").select("points").eq("user_id", studentId),
  ]);
  return {
    studentId,
    name: profileRes.data?.display_name ?? "Student",
    examGoal: profileRes.data?.exam_goal ?? null,
    xp: profileRes.data?.xp ?? 0,
    level: profileRes.data?.level ?? 1,
    streakDays: profileRes.data?.streak_days ?? 0,
    points: (pointsRes.data ?? []).reduce((sum, p) => sum + p.points, 0),
    lessons: (lessonsRes.data ?? []).map((l) => ({
      topic: l.topic,
      subject: l.subject,
      completed: l.completed,
      updatedAt: l.updated_at,
    })),
    tests: (testsRes.data ?? []).map((t) => ({
      exam: t.exam,
      topic: t.topic,
      score: Number(t.score),
      total: Number(t.total),
      createdAt: t.created_at,
    })),
  };
}

async function importAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Parent dashboard: every child linked to the signed-in parent, with progress. */
export const getParentOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links } = await context.supabase
      .from("family_links")
      .select("student_id")
      .eq("parent_id", context.userId);
    const admin = await importAdmin();
    const children: StudentProgress[] = [];
    for (const link of links ?? []) {
      children.push(await progressFor(admin, link.student_id));
    }
    return { children };
  });

/**
 * Link a child to the signed-in account by the child's login email.
 * The linker becomes a parent (role granted automatically).
 */
export const linkChild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await importAdmin();
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
    const child = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!child) return { ok: false as const, reason: "No account found with that email." };
    if (child.id === context.userId)
      return { ok: false as const, reason: "You cannot link yourself as a child." };

    const { error } = await admin.from("family_links").upsert(
      { parent_id: context.userId, student_id: child.id },
      { onConflict: "parent_id,student_id", ignoreDuplicates: true },
    );
    if (error) return { ok: false as const, reason: error.message };
    await admin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "parent" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    return { ok: true as const, reason: null };
  });
