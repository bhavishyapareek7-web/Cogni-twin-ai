import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function importAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type MemberProgress = {
  memberId: string;
  name: string;
  role: string;
  xp: number;
  level: number;
  streakDays: number;
  lessonsDone: number;
  testsTaken: number;
  bestScore: number | null;
};

async function hasOrgAdminRole(supabase: SupabaseClient<Database>, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const held = new Set((roles ?? []).map((r) => r.role as string));
  return held.has("org_admin") || held.has("super_admin") || held.has("admin");
}

async function memberProgress(
  admin: Awaited<ReturnType<typeof importAdmin>>,
  memberId: string,
  role: string,
): Promise<MemberProgress> {
  const [profileRes, lessonsRes, testsRes] = await Promise.all([
    admin.from("profiles").select("display_name, xp, level, streak_days").eq("id", memberId).maybeSingle(),
    admin
      .from("lesson_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", memberId)
      .eq("completed", true),
    admin.from("mock_tests").select("score, total").eq("user_id", memberId),
  ]);
  const tests = testsRes.data ?? [];
  const best = tests.reduce<number | null>(
    (acc, t) => (Number(t.total) > 0 ? Math.max(acc ?? 0, (Number(t.score) / Number(t.total)) * 100) : acc),
    null,
  );
  return {
    memberId,
    name: profileRes.data?.display_name ?? "Member",
    role,
    xp: profileRes.data?.xp ?? 0,
    level: profileRes.data?.level ?? 1,
    streakDays: profileRes.data?.streak_days ?? 0,
    lessonsDone: lessonsRes.count ?? 0,
    testsTaken: tests.length,
    bestScore: best,
  };
}

/** Teacher dashboard: only students explicitly assigned to the signed-in teacher. */
export const getTeacherOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: assignments } = await context.supabase
      .from("teacher_assignments")
      .select("student_id")
      .eq("teacher_id", context.userId);
    const studentIds = [...new Set((assignments ?? []).map((a) => a.student_id))];
    const admin = await importAdmin();
    const students: MemberProgress[] = [];
    for (const studentId of studentIds) {
      students.push(await memberProgress(admin, studentId, "student"));
    }
    return { students };
  });

/** Organization admin dashboard: members and teacher-student assignments. */
export const getOrgOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isOrgAdmin = await hasOrgAdminRole(context.supabase, context.userId);
    const [membersRes, assignmentsRes] = await Promise.all([
      context.supabase
        .from("org_members")
        .select("member_id, member_role")
        .eq("org_id", context.userId),
      context.supabase
        .from("teacher_assignments")
        .select("id, teacher_id, student_id")
        .eq("org_id", context.userId),
    ]);
    const admin = await importAdmin();
    const members: MemberProgress[] = [];
    for (const row of membersRes.data ?? []) {
      members.push(await memberProgress(admin, row.member_id, row.member_role));
    }
    const names = new Map(members.map((member) => [member.memberId, member.name]));
    const assignments = (assignmentsRes.data ?? []).map((assignment) => ({
      id: assignment.id,
      teacherId: assignment.teacher_id,
      studentId: assignment.student_id,
      teacherName: names.get(assignment.teacher_id) ?? "Teacher",
      studentName: names.get(assignment.student_id) ?? "Student",
    }));
    return { isOrgAdmin, members, assignments };
  });

/** Organization admin adds a student or teacher by their login email. */
export const addOrgMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: string }) =>
    z
      .object({ email: z.string().trim().email().max(255), role: z.enum(["teacher", "student"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await hasOrgAdminRole(context.supabase, context.userId))) {
      return { ok: false as const, reason: "Only organization admins can add members." };
    }

    const admin = await importAdmin();
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
    const member = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    if (!member) return { ok: false as const, reason: "No account found with that email." };
    if (member.id === context.userId)
      return { ok: false as const, reason: "You cannot add yourself as a member." };

    const { error } = await admin.from("org_members").upsert(
      { org_id: context.userId, member_id: member.id, member_role: data.role },
      { onConflict: "org_id,member_id" },
    );
    if (error) return { ok: false as const, reason: error.message };
    if (data.role === "teacher") {
      await admin
        .from("user_roles")
        .upsert(
          { user_id: member.id, role: "teacher" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
    }
    return { ok: true as const, reason: null };
  });

/** Organization admin assigns one of their students to one of their teachers. */
export const assignStudentToTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { teacherId: string; studentId: string }) =>
    z.object({ teacherId: z.string().uuid(), studentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await hasOrgAdminRole(context.supabase, context.userId))) {
      return { ok: false as const, reason: "Only organization admins can assign students." };
    }
    if (data.teacherId === data.studentId) {
      return { ok: false as const, reason: "Choose different teacher and student accounts." };
    }
    const { error } = await context.supabase.from("teacher_assignments").insert({
      org_id: context.userId,
      teacher_id: data.teacherId,
      student_id: data.studentId,
    });
    if (error) {
      return {
        ok: false as const,
        reason:
          error.code === "23505"
            ? "That student is already assigned to this teacher."
            : "Choose a teacher and student who both belong to your organization.",
      };
    }
    return { ok: true as const, reason: null };
  });

/** Organization admin removes a teacher-student assignment. */
export const removeTeacherAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await hasOrgAdminRole(context.supabase, context.userId))) {
      return { ok: false as const, reason: "Only organization admins can remove assignments." };
    }
    const { data: removed, error } = await context.supabase
      .from("teacher_assignments")
      .delete()
      .eq("id", data.id)
      .eq("org_id", context.userId)
      .select("id");
    if (error || !removed?.length) {
      return { ok: false as const, reason: "Assignment not found or already removed." };
    }
    return { ok: true as const, reason: null };
  });
