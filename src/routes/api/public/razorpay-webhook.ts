import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("ok");
        }
        const subId: string | undefined =
          body?.payload?.subscription?.entity?.id ?? body?.payload?.payment?.entity?.subscription_id;
        if (!subId || typeof subId !== "string") return new Response("ok");
        try {
          const { syncSubscription } = await import("@/lib/billing.server");
          await syncSubscription(subId); // returns null for unknown ids
          return new Response("ok");
        } catch (e) {
          console.error("razorpay webhook", e);
          return new Response("retry", { status: 500 });
        }
      },
    },
  },
});
