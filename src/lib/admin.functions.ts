import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminRole } from "@/lib/access.server";

const PLANS = ["premium", "lifetime"] as const;

/** Admin dashboard headline numbers. */
export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminRole(context.supabase, context.userId, [
      "super_admin",
      "admin",
      "support_admin",
      "content_admin",
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const soon = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [profiles, subs, newUsers, lessons, tests, usage, flags, logs] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("user_id, plan, status, expires_at"),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      supabaseAdmin.from("lesson_sessions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("mock_tests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("ai_usage").select("kind, amount"),
      supabaseAdmin.from("feature_flags").select("feature, enabled"),
      supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    const now = Date.now();
    const active = (subs.data ?? []).filter(
      (s) =>
        s.status === "active" &&
        s.plan !== "free" &&
        (!s.expires_at || new Date(s.expires_at).getTime() > now),
    );
    const usageByKind: Record<string, number> = {};
    for (const row of usage.data ?? [])
      usageByKind[row.kind] = (usageByKind[row.kind] ?? 0) + Number(row.amount);

    const total = profiles.count ?? 0;
    const premium = new Set(active.map((s) => s.user_id)).size;
    return {
      totals: {
        users: total,
        premium,
        free: Math.max(0, total - premium),
        newThisWeek: newUsers.count ?? 0,
        expiringSoon: active.filter((s) => s.expires_at && s.expires_at <= soon).length,
        classroomSessions: lessons.count ?? 0,
        mockTests: tests.count ?? 0,
      },
      usage: usageByKind,
      flags: flags.data ?? [],
      logs: logs.data ?? [],
    };
  });

/** Searchable user list with membership status. */
export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query?: string }) =>
    z.object({ query: z.string().trim().max(120).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId, [
      "super_admin",
      "admin",
      "support_admin",
    ]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const [profiles, subs, roles] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, exam_goal, xp, level, onboarded"),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan, status, expires_at, started_at")
        .eq("status", "active"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const subByUser = new Map((subs.data ?? []).map((s) => [s.user_id, s]));
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles.data ?? [])
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as string]);

    const now = Date.now();
    const q = data.query?.toLowerCase() ?? "";
    return (authUsers?.users ?? [])
      .map((u) => {
        const sub = subByUser.get(u.id);
        const live =
          !!sub && sub.plan !== "free" && (!sub.expires_at || new Date(sub.expires_at).getTime() > now);
        return {
          id: u.id,
          email: u.email ?? "",
          createdAt: u.created_at,
          suspended: !!(u as { banned_until?: string | null }).banned_until,
          displayName: profileById.get(u.id)?.display_name ?? null,
          examGoal: profileById.get(u.id)?.exam_goal ?? null,
          xp: profileById.get(u.id)?.xp ?? 0,
          premium: live,
          plan: live ? sub!.plan : "free",
          expiresAt: live ? (sub!.expires_at ?? null) : null,
          roles: rolesByUser.get(u.id) ?? [],
        };
      })
      .filter(
        (u) =>
          !q ||
          u.email.toLowerCase().includes(q) ||
          (u.displayName ?? "").toLowerCase().includes(q),
      )
      .slice(0, 100);
  });

/** Grant or extend Premium for one learner. Always audit-logged. */
export const adminGrantPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email(),
        plan: z.enum(PLANS).default("premium"),
        days: z.number().int().min(0).max(3650),
        reason: z.string().trim().max(200).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const target = (list?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );
    if (!target) throw new Error("No learner with that email.");

    const lifetime = data.plan === "lifetime" || data.days === 0;
    const expires = lifetime ? null : new Date(Date.now() + data.days * 86_400_000).toISOString();

    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "superseded" })
      .eq("user_id", target.id)
      .eq("status", "active");

    const { error } = await supabaseAdmin.from("subscriptions").insert({
      user_id: target.id,
      plan: data.plan,
      status: "active",
      expires_at: expires,
      granted_by: context.userId,
      reason: data.reason ?? null,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: "premium_granted",
      target_user_id: target.id,
      metadata: { email: data.email, plan: data.plan, days: data.days, reason: data.reason ?? null },
    });
    return { ok: true as const, expiresAt: expires };
  });

/** Revoke Premium. Learning data is always preserved. */
export const adminRevokePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; reason?: string }) =>
    z
      .object({ userId: z.string().uuid(), reason: z.string().trim().max(200).optional() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "revoked" })
      .eq("user_id", data.userId)
      .eq("status", "active");
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: "premium_revoked",
      target_user_id: data.userId,
      metadata: { reason: data.reason ?? null },
    });
    return { ok: true as const };
  });

/** Bulk grant from a pasted list of emails. */
export const adminBulkGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        emails: z.array(z.string().trim().min(3).max(160)).min(1).max(200),
        plan: z.enum(PLANS).default("premium"),
        days: z.number().int().min(0).max(3650),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const byEmail = new Map(
      (list?.users ?? []).map((u) => [(u.email ?? "").toLowerCase(), u.id] as const),
    );
    const lifetime = data.plan === "lifetime" || data.days === 0;
    const expires = lifetime ? null : new Date(Date.now() + data.days * 86_400_000).toISOString();

    const results: Array<{ email: string; status: string }> = [];
    for (const raw of data.emails) {
      const email = raw.toLowerCase();
      const id = byEmail.get(email);
      if (!id) {
        results.push({ email: raw, status: "user not found" });
        continue;
      }
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "superseded" })
        .eq("user_id", id)
        .eq("status", "active");
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        user_id: id,
        plan: data.plan,
        status: "active",
        expires_at: expires,
        granted_by: context.userId,
        reason: "bulk grant",
      });
      results.push({ email: raw, status: error ? "failed" : "granted" });
    }
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: "premium_bulk_granted",
      metadata: { count: results.filter((r) => r.status === "granted").length, plan: data.plan },
    });
    return { results };
  });

/** Turn a Premium feature on or off for everyone, without a redeploy. */
export const adminSetFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feature: string; enabled: boolean }) =>
    z.object({ feature: z.string().trim().min(3).max(64), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("feature_flags")
      .update({ enabled: data.enabled })
      .eq("feature", data.feature);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: data.enabled ? "feature_enabled" : "feature_disabled",
      metadata: { feature: data.feature },
    });
    return { ok: true as const };
  });

/** Suspend or restore an account. Super Admin only. */
export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) =>
    z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId, ["super_admin"]);
    if (data.userId === context.userId) throw new Error("You can't suspend your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? "87600h" : "none",
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: data.suspended ? "user_suspended" : "user_restored",
      target_user_id: data.userId,
      metadata: {},
    });
    return { ok: true as const };
  });

/** Add or remove an admin role. Super Admin only. */
export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["super_admin", "admin", "content_admin", "support_admin"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdminRole(context.supabase, context.userId, ["super_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      if (data.userId === context.userId && data.role === "super_admin")
        throw new Error("You can't remove your own Super Admin role.");
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
    }
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: data.grant ? "role_granted" : "role_revoked",
      target_user_id: data.userId,
      metadata: { role: data.role },
    });
    return { ok: true as const };
  });
