import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_PASSWORD = "EduTwin-Demo!2026";

const ACCOUNTS = {
  student: { email: "demo-student@edutwin.ai", name: "Demo Student", role: null },
  teacher: { email: "demo-teacher@edutwin.ai", name: "Demo Teacher", role: "teacher" },
  parent: { email: "demo-parent@edutwin.ai", name: "Demo Parent", role: "parent" },
  org: { email: "demo-org@edutwin.ai", name: "Demo Organization", role: "org_admin" },
} as const;

type DemoKind = keyof typeof ACCOUNTS;

/**
 * One-step demo login. Ensures the requested demo account exists (with the
 * right role, family/org links and sample progress), then returns its
 * credentials so the client can sign in. Demo accounts are intentionally
 * public; they hold no real user data.
 */
export const demoLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { kind: string }) =>
    z.object({ kind: z.enum(["student", "teacher", "parent", "org"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = new Map<DemoKind, string>();
    for (const [kind, acc] of Object.entries(ACCOUNTS) as Array<
      [DemoKind, (typeof ACCOUNTS)[DemoKind]]
    >) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: acc.name },
      });
      let userId = created.user?.id ?? null;
      if (!userId) {
        const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 200,
        });
        if (listError) {
          throw new Error(
            `Demo setup failed: ${createError?.message ?? "create failed"} / ${listError.message}`,
          );
        }
        userId = list.users.find((u) => u.email === acc.email)?.id ?? null;
        if (userId) {
          await supabaseAdmin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });
        }
      }
      if (!userId)
        throw new Error(
          `Demo setup failed: ${createError?.message ?? "account not found after create"}`,
        );
      ids.set(kind, userId);

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, display_name: acc.name, onboarded: true });
      if (acc.role) {
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: userId, role: acc.role },
            { onConflict: "user_id,role", ignoreDuplicates: true },
          );
      }
    }

    const studentId = ids.get("student")!;
    const teacherId = ids.get("teacher")!;
    const parentId = ids.get("parent")!;
    const orgId = ids.get("org")!;

    await supabaseAdmin
      .from("family_links")
      .upsert(
        { parent_id: parentId, student_id: studentId },
        { onConflict: "parent_id,student_id", ignoreDuplicates: true },
      );
    await supabaseAdmin.from("org_members").upsert(
      [
        { org_id: orgId, member_id: teacherId, member_role: "teacher" },
        { org_id: orgId, member_id: studentId, member_role: "student" },
      ],
      { onConflict: "org_id,member_id", ignoreDuplicates: true },
    );

    // Seed sample progress for the demo student so the dashboards have something to show.
    const { count } = await supabaseAdmin
      .from("lesson_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", studentId);
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("lesson_sessions").insert([
        {
          user_id: studentId,
          topic: "Newton's Laws of Motion",
          subject: "Physics",
          slide_index: 3,
          completed: true,
        },
        {
          user_id: studentId,
          topic: "Quadratic Equations",
          subject: "Mathematics",
          slide_index: 1,
          completed: false,
        },
        {
          user_id: studentId,
          topic: "Chemical Bonding",
          subject: "Chemistry",
          slide_index: 4,
          completed: true,
        },
      ]);
      await supabaseAdmin.from("mock_tests").insert([
        {
          user_id: studentId,
          exam: "JEE Main",
          topic: "Physics: Mechanics",
          score: 62,
          total: 100,
          accuracy: 0.68,
          predicted_percentile: 92.4,
          rank_low: 8500,
          rank_high: 14000,
        },
        {
          user_id: studentId,
          exam: "JEE Main",
          topic: "Mathematics: Algebra",
          score: 48,
          total: 100,
          accuracy: 0.55,
          predicted_percentile: 85.1,
          rank_low: 22000,
          rank_high: 31000,
        },
      ]);
      await supabaseAdmin.from("point_ledger").insert([
        { user_id: studentId, kind: "study", points: 120, note: "2 hours of focused study" },
        { user_id: studentId, kind: "bonus", points: 30, note: "7-day streak bonus" },
      ]);
    }

    const acc = ACCOUNTS[data.kind];
    return { email: acc.email, password: DEMO_PASSWORD };
  });
