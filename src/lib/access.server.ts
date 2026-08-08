import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export type AccessSnapshot = {
  premium: boolean;
  plan: string;
  expiresAt: string | null;
  daysLeft: number | null;
  roles: string[];
  isAdmin: boolean;
  features: Array<{ id: string; name: string; description: string; enabled: boolean }>;
  usage: Array<{ kind: string; amount: number }>;
};

/** Server-side truth for what a learner can access. Never trust the client for this. */
export async function getAccessSnapshot(supabase: Client, userId: string): Promise<AccessSnapshot> {
  const [premiumRes, subRes, rolesRes, featuresRes, flagsRes, entRes, usageRes] = await Promise.all([
    supabase.rpc("is_premium", { _user_id: userId }),
    supabase
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("features").select("id, name, description, status").eq("status", "active"),
    supabase.from("feature_flags").select("feature, enabled"),
    supabase.from("entitlements").select("feature, status, expires_at").eq("user_id", userId),
    supabase.from("ai_usage").select("kind, amount").eq("user_id", userId),
  ]);

  const premium = premiumRes.data === true;
  const flags = new Map((flagsRes.data ?? []).map((f) => [f.feature, f.enabled]));
  const now = Date.now();
  const grants = new Set(
    (entRes.data ?? [])
      .filter(
        (e) => e.status === "active" && (!e.expires_at || new Date(e.expires_at).getTime() > now),
      )
      .map((e) => e.feature),
  );

  const expiresAt = subRes.data?.expires_at ?? null;
  const roles = (rolesRes.data ?? []).map((r) => r.role as string);

  return {
    premium,
    plan: premium ? (subRes.data?.plan ?? "premium") : "free",
    expiresAt,
    daysLeft: expiresAt
      ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 86_400_000))
      : null,
    roles,
    isAdmin: roles.length > 0,
    features: (featuresRes.data ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      enabled: (flags.get(f.id) ?? true) && (premium || grants.has(f.id)),
    })),
    usage: (usageRes.data ?? []).map((u) => ({ kind: u.kind, amount: Number(u.amount) })),
  };
}

/** Throws unless the learner may use `feature` right now. */
export async function requireFeature(supabase: Client, userId: string, feature: string) {
  const access = await getAccessSnapshot(supabase, userId);
  const match = access.features.find((f) => f.id === feature);
  if (!match?.enabled) throw new Error("This is a Premium feature. Upgrade to unlock it.");
  return access;
}

/** Throws unless the caller holds one of the given admin roles. */
export async function requireAdminRole(
  supabase: Client,
  userId: string,
  allowed: Array<Database["public"]["Enums"]["app_role"]> = ["super_admin", "admin"],
) {
  const checks = await Promise.all(
    allowed.map((role) => supabase.rpc("has_role", { _user_id: userId, _role: role })),
  );
  if (!checks.some((c) => c.data === true)) throw new Error("Administrator access required.");
}
