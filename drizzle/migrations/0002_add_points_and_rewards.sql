CREATE TABLE public.point_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'study' CHECK (kind IN ('study', 'bonus', 'redeem')),
  points INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.point_ledger TO authenticated;
GRANT ALL ON public.point_ledger TO service_role;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own points readable" ON public.point_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own points insertable" ON public.point_ledger FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cost INTEGER NOT NULL CHECK (cost > 0),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed-in users read active rewards" ON public.rewards FOR SELECT TO authenticated USING (status = 'active');
INSERT INTO public.rewards (id, name, description, cost) VALUES
  ('avatar-glow', 'Golden Avatar Glow', 'Give your classroom AI avatar a golden glow for a week.', 50),
  ('theme-nebula', 'Nebula Theme', 'Unlock the deep-space Nebula look for your dashboard.', 100),
  ('mock-test-pass', 'Extra Mock Test', 'One extra AI-generated mock test on any topic you choose.', 150),
  ('streak-shield', 'Streak Shield', 'Protect your study streak for one missed day.', 200);

CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES public.rewards(id),
  points_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions readable" ON public.redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own redemptions insertable" ON public.redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);