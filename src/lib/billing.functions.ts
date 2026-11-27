import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("billing_subscriptions")
      .select("tier, status, trial_ends_at, current_end, cancel_at_cycle_end, razorpay_subscription_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });

export const startSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { tier: string }) => z.object({ tier: z.enum(["student", "organization"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const b = await import("@/lib/billing.server");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { keyId, mode } = b.razorpayEnv();
    const planId = await b.ensurePlan(data.tier);

    const { data: existing } = await db
      .from("billing_subscriptions")
      .select("razorpay_subscription_id, status, razorpay_plan_id")
      .eq("user_id", context.userId)
      .eq("razorpay_plan_id", planId)
      .eq("status", "created")
      .maybeSingle();
    if (existing) return { subscriptionId: existing.razorpay_subscription_id, keyId };

    const { data: trial } = await db.from("billing_trials").select("user_id").eq("user_id", context.userId).maybeSingle();
    const trialEnd = trial ? null : Math.floor(Date.now() / 1000) + b.TRIAL_DAYS * 86400;

    const sub = await b.razorpay("subscriptions", {
      method: "POST",
      body: {
        plan_id: planId,
        total_count: 120,
        customer_notify: 1,
        notes: { userId: context.userId, tier: data.tier },
        ...(trialEnd ? { start_at: trialEnd } : {}),
      },
    });
    const { error } = await db.from("billing_subscriptions").insert({
      user_id: context.userId,
      tier: data.tier,
      mode,
      razorpay_subscription_id: sub.id,
      razorpay_plan_id: planId,
      status: sub.status ?? "created",
      trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
    });
    if (error) throw new Error(error.message);
    return { subscriptionId: sub.id as string, keyId };
  });

async function ownedSub(supabase: any, userId: string, id: string) {
  const { data } = await supabase
    .from("billing_subscriptions")
    .select("razorpay_subscription_id, status")
    .eq("user_id", userId)
    .eq("razorpay_subscription_id", id)
    .maybeSingle();
  if (!data) throw new Error("Subscription not found");
  return data;
}

export const confirmSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { subscriptionId: string }) => z.object({ subscriptionId: z.string().min(5).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    await ownedSub(context.supabase, context.userId, data.subscriptionId);
    const { syncSubscription } = await import("@/lib/billing.server");
    return syncSubscription(data.subscriptionId);
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { subscriptionId: string }) => z.object({ subscriptionId: z.string().min(5).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    const row = await ownedSub(context.supabase, context.userId, data.subscriptionId);
    const b = await import("@/lib/billing.server");
    const atEnd = row.status === "active" || row.status === "pending";
    await b.razorpay(`subscriptions/${data.subscriptionId}/cancel`, {
      method: "POST",
      body: { cancel_at_cycle_end: atEnd ? 1 : 0 },
    });
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    if (atEnd) await db.from("billing_subscriptions").update({ cancel_at_cycle_end: true }).eq("razorpay_subscription_id", data.subscriptionId);
    return b.syncSubscription(data.subscriptionId);
  });
