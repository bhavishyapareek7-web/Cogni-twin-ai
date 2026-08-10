import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAccessSnapshot } from "@/lib/access.server";

/** Server-side entitlement snapshot for the signed-in learner. */
export const getAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getAccessSnapshot(context.supabase, context.userId));

/**
 * Non-throwing entitlement check used by the Premium hub UI.
 * Real enforcement still happens inside each Premium server function.
 */
export const openFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feature: string }) =>
    z.object({ feature: z.string().trim().min(3).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const access = await getAccessSnapshot(context.supabase, context.userId);
    const allowed = access.features.some((f) => f.id === data.feature && f.enabled);
    return {
      allowed,
      feature: data.feature,
      reason: allowed ? null : "This is a Premium feature. Ask an administrator to unlock it.",
    };
  });


/**
 * One-time bootstrap: the very first signed-in user can claim Super Admin,
 * and only while no administrator exists yet.
 */
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return { ok: false as const, reason: "An administrator already exists." };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (error) return { ok: false as const, reason: error.message };
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: "bootstrap_super_admin",
      target_user_id: context.userId,
      metadata: {},
    });
    return { ok: true as const, reason: null };
  });
