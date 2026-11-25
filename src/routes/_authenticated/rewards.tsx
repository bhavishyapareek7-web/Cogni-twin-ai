import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Gift, History, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getPoints, redeemReward } from "@/lib/points.functions";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards Marketplace — EduTwin AI" },
      {
        name: "description",
        content:
          "Turn study time into points and redeem them for avatar styles, themes, extra mock tests and streak shields on EduTwin AI.",
      },
      { property: "og:title", content: "Rewards Marketplace — EduTwin AI" },
      {
        property: "og:description",
        content: "Every focused minute earns a point. Spend them in the rewards marketplace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const queryClient = useQueryClient();
  const loadPoints = useServerFn(getPoints);
  const redeem = useServerFn(redeemReward);

  const { data, isLoading } = useQuery({
    queryKey: ["points"],
    queryFn: () => loadPoints({}),
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId: string) => redeem({ data: { rewardId } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Reward redeemed! Enjoy it.");
        void queryClient.invalidateQueries({ queryKey: ["points"] });
      } else {
        toast.error(result.reason ?? "Could not redeem that reward");
      }
    },
    onError: () => toast.error("Could not redeem that reward"),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-neural glow">
              <Gift className="size-5 text-primary-foreground" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Rewards Marketplace</h1>
              <p className="text-sm text-muted-foreground">
                Every focused minute earns 1 point. Spend them here.
              </p>
            </div>
          </div>
          <div className="panel flex items-center gap-2 px-4 py-2.5">
            <Sparkles className="size-4 text-accent" />
            <span className="text-lg font-bold">{data?.balance ?? 0}</span>
            <span className="text-sm text-muted-foreground">points</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(data?.rewards ?? []).map((reward) => {
                const affordable = (data?.balance ?? 0) >= reward.cost;
                return (
                  <div key={reward.id} className="panel flex flex-col p-5">
                    <h2 className="font-semibold">{reward.name}</h2>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Sparkles className="size-3.5 text-accent" /> {reward.cost}
                      </span>
                      <Button
                        size="sm"
                        className="bg-neural"
                        disabled={!affordable || redeemMutation.isPending}
                        onClick={() => redeemMutation.mutate(reward.id)}
                      >
                        {affordable ? "Redeem" : "Not enough"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="panel mt-8 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="size-4 text-accent" /> Recent activity
              </h2>
              {(data?.ledger ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No points yet — study in the classroom to start earning.
                </p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {(data?.ledger ?? []).slice(0, 10).map((entry, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted-foreground">{entry.note}</span>
                      <span
                        className={
                          entry.points >= 0 ? "font-medium text-accent" : "font-medium"
                        }
                      >
                        {entry.points >= 0 ? `+${entry.points}` : entry.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
