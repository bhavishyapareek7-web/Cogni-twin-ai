ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_admin';

CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_links TO authenticated;
GRANT ALL ON public.family_links TO service_role;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents read own links" ON public.family_links FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "students read own links" ON public.family_links FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "parents create own links" ON public.family_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "parents delete own links" ON public.family_links FOR DELETE TO authenticated USING (auth.uid() = parent_id);

CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'student' CHECK (member_role IN ('teacher', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org admins read members" ON public.org_members FOR SELECT TO authenticated USING (auth.uid() = org_id);
CREATE POLICY "members read own membership" ON public.org_members FOR SELECT TO authenticated USING (auth.uid() = member_id);
CREATE POLICY "org admins add members" ON public.org_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = org_id);
CREATE POLICY "org admins remove members" ON public.org_members FOR DELETE TO authenticated USING (auth.uid() = org_id);