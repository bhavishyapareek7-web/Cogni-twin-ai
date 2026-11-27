CREATE TABLE public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  mode text NOT NULL,
  amount_paise integer NOT NULL,
  razorpay_plan_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tier, mode, amount_paise)
);
GRANT ALL ON public.billing_plans TO service_role;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL,
  mode text NOT NULL,
  razorpay_subscription_id text NOT NULL UNIQUE,
  razorpay_plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'created',
  trial_ends_at timestamptz,
  current_end timestamptz,
  cancel_at_cycle_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_subscriptions_user_idx ON public.billing_subscriptions(user_id);
GRANT SELECT ON public.billing_subscriptions TO authenticated;
GRANT ALL ON public.billing_subscriptions TO service_role;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own billing subscriptions" ON public.billing_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.billing_trials (
  user_id uuid PRIMARY KEY,
  used_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.billing_trials TO service_role;
ALTER TABLE public.billing_trials ENABLE ROW LEVEL SECURITY;