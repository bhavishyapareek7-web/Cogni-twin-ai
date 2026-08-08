import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAccessSnapshot, requireFeature } from "@/lib/access.server";

/** Server-side entitlement snapshot for the signed-in learner. */
export const getAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getAccessSnapshot(context.supabase, context.userId));

/** Gate used before entering any Premium surface. Authoritative, server-side. */
export const openFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feature: string }) =>
    z.object({ feature: z.string().trim().min(3).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireFeature(context.supabase, context.userId, data.feature);
    return { allowed: true as const, feature: data.feature };
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
    if ((count ?? 0) > 0) throw new Error("An administrator already exists.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: context.userId,
      action: "bootstrap_super_admin",
      target_user_id: context.userId,
      metadata: {},
    });
    return { ok: true as const };
  });
