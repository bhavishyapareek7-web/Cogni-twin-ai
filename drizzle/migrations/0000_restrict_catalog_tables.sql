DROP POLICY IF EXISTS "plans are public" ON public.plans;
DROP POLICY IF EXISTS "features are public" ON public.features;
DROP POLICY IF EXISTS "flags are public" ON public.feature_flags;
REVOKE SELECT ON public.plans, public.features, public.feature_flags FROM anon;
GRANT SELECT ON public.plans, public.features, public.feature_flags TO authenticated;
CREATE POLICY "signed-in users read active plans" ON public.plans FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "signed-in users read active features" ON public.features FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "signed-in users read flags" ON public.feature_flags FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);