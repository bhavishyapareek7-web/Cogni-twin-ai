const GATEWAY_URL = "https://connector-gateway.lovable.dev/razorpay";

export const TIERS = {
  student: { name: "EduTwin Student (monthly)", amountPaise: 5000 },
  organization: { name: "EduTwin Organisation (monthly)", amountPaise: 100000 },
} as const;
export type Tier = keyof typeof TIERS;
export const TRIAL_DAYS = 7;

export function razorpayEnv() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["RAZORPAY_CONNECTION_KEY"];
  const keyId = process.env["RAZORPAY_CONNECTION_KEY_ID"];
  if (!lovableKey || !connectionKey || !keyId) throw new Error("Razorpay is not connected");
  return { lovableKey, connectionKey, keyId, mode: keyId.startsWith("rzp_live_") ? "live" : "test" };
}

export async function razorpay(path: string, init: { method?: string; body?: unknown } = {}) {
  const { lovableKey, connectionKey } = razorpayEnv();
  const res = await fetch(`${GATEWAY_URL}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Razorpay ${path} failed [${res.status}]: ${text}`);
    let msg = text;
    try {
      msg = JSON.parse(text)?.error?.description ?? text;
    } catch {}
    throw new Error(`Razorpay: ${msg}`);
  }
  return res.json();
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function ensurePlan(tier: Tier): Promise<string> {
  const db = await admin();
  const { mode } = razorpayEnv();
  const t = TIERS[tier];
  const { data } = await db
    .from("billing_plans")
    .select("razorpay_plan_id")
    .eq("tier", tier)
    .eq("mode", mode)
    .eq("amount_paise", t.amountPaise)
    .maybeSingle();
  if (data) return data.razorpay_plan_id;
  const plan = await razorpay("plans", {
    method: "POST",
    body: { period: "monthly", interval: 1, item: { name: t.name, amount: t.amountPaise, currency: "INR" } },
  });
  await db.from("billing_plans").insert({ tier, mode, amount_paise: t.amountPaise, razorpay_plan_id: plan.id });
  return plan.id as string;
}

/** Access until this time, or null for no access. Pure rule from the status table. */
export function accessUntil(
  status: string,
  trialEndsAt: string | null,
  currentEnd: string | null,
  now = Date.now(),
): string | null {
  const future = (iso: string | null) => (iso && new Date(iso).getTime() > now ? iso : null);
  if (status === "active" || status === "pending") return currentEnd ?? trialEndsAt ?? new Date(now + 86_400_000).toISOString();
  if (status === "authenticated") return future(trialEndsAt);
  if (["cancelled", "completed", "expired"].includes(status)) return future(currentEnd) ?? future(trialEndsAt);
  return null;
}

/** The only code that grants or removes paid access. */
export async function syncSubscription(rzpSubId: string) {
  const db = await admin();
  const { data: row } = await db
    .from("billing_subscriptions")
    .select("*")
    .eq("razorpay_subscription_id", rzpSubId)
    .maybeSingle();
  if (!row) return null;
  const sub = await razorpay(`subscriptions/${rzpSubId}`);
  const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
  const status: string = sub.status;
  await db
    .from("billing_subscriptions")
    .update({ status, current_end: currentEnd, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (status === "authenticated" || status === "active") {
    await db.from("billing_trials").upsert({ user_id: row.user_id }, { onConflict: "user_id", ignoreDuplicates: true });
  }
  const until = accessUntil(status, row.trial_ends_at, currentEnd);
  await db.from("subscriptions").delete().eq("user_id", row.user_id).eq("reason", "razorpay").eq("note", rzpSubId);
  if (until) {
    await db.from("subscriptions").insert({
      user_id: row.user_id,
      plan: row.tier,
      status: "active",
      expires_at: until,
      reason: "razorpay",
      note: rzpSubId,
    });
  }
  return { status, until };
}
