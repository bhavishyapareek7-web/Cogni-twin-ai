import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Points balance, recent activity and the rewards catalog for the signed-in learner. */
export const getPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [ledgerRes, rewardsRes, redemptionsRes] = await Promise.all([
      context.supabase
        .from("point_ledger")
        .select("kind, points, note, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.from("rewards").select("id, name, description, cost").eq("status", "active"),
      context.supabase
        .from("redemptions")
        .select("reward_id, points_spent, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const ledger = ledgerRes.data ?? [];
    return {
      balance: ledger.reduce((sum, e) => sum + e.points, 0),
      ledger: ledger.map((e) => ({
        kind: e.kind,
        points: e.points,
        note: e.note,
        createdAt: e.created_at,
      })),
      rewards: (rewardsRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        cost: r.cost,
      })),
      redemptions: (redemptionsRes.data ?? []).map((r) => ({
        rewardId: r.reward_id,
        pointsSpent: r.points_spent,
        createdAt: r.created_at,
      })),
    };
  });

/**
 * Award study points: 1 point per focused minute, capped at 180 per award.
 * The classroom and planner call this after focused study time.
 */
export const awardStudyPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { minutes: number; note?: string }) =>
    z
      .object({
        minutes: z.number().int().min(1).max(180),
        note: z.string().trim().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("point_ledger").insert({
      user_id: context.userId,
      kind: "study",
      points: data.minutes,
      note: data.note ?? `${data.minutes} minutes of focused study`,
    });
    if (error) return { ok: false as const, reason: error.message, awarded: 0 };
    return { ok: true as const, reason: null, awarded: data.minutes };
  });

/** Redeem a marketplace reward with the learner's points balance. */
export const redeemReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rewardId: string }) =>
    z.object({ rewardId: z.string().trim().min(2).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: reward } = await context.supabase
      .from("rewards")
      .select("id, name, cost")
      .eq("id", data.rewardId)
      .eq("status", "active")
      .maybeSingle();
    if (!reward) return { ok: false as const, reason: "That reward is not available." };

    const { data: ledger } = await context.supabase
      .from("point_ledger")
      .select("points")
      .eq("user_id", context.userId);
    const balance = (ledger ?? []).reduce((sum, e) => sum + e.points, 0);
    if (balance < reward.cost) {
      return {
        ok: false as const,
        reason: `You need ${reward.cost - balance} more points for ${reward.name}.`,
      };
    }

    const { error: spendError } = await context.supabase.from("point_ledger").insert({
      user_id: context.userId,
      kind: "redeem",
      points: -reward.cost,
      note: `Redeemed: ${reward.name}`,
    });
    if (spendError) return { ok: false as const, reason: spendError.message };

    const { error } = await context.supabase.from("redemptions").insert({
      user_id: context.userId,
      reward_id: reward.id,
      points_spent: reward.cost,
    });
    if (error) return { ok: false as const, reason: error.message };
    return { ok: true as const, reason: null };
  });
