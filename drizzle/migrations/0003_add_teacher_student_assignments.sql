CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_assignments_unique UNIQUE (org_id, teacher_id, student_id),
  CONSTRAINT teacher_assignments_distinct_people CHECK (teacher_id <> student_id)
);

INSERT INTO public.teacher_assignments (org_id, teacher_id, student_id)
SELECT teachers.org_id, teachers.member_id, students.member_id
FROM public.org_members AS teachers
JOIN public.org_members AS students
  ON students.org_id = teachers.org_id
 AND students.member_role = 'student'
WHERE teachers.member_role = 'teacher'
  AND teachers.member_id <> students.member_id
ON CONFLICT (org_id, teacher_id, student_id) DO NOTHING;

GRANT SELECT, INSERT, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org admins read assignments"
ON public.teacher_assignments FOR SELECT TO authenticated
USING (auth.uid() = org_id);

CREATE POLICY "teachers read own assignments"
ON public.teacher_assignments FOR SELECT TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "students read own teacher assignments"
ON public.teacher_assignments FOR SELECT TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "org admins assign their teachers and students"
ON public.teacher_assignments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = org_id
  AND EXISTS (
    SELECT 1 FROM public.org_members AS teacher_membership
    WHERE teacher_membership.org_id = auth.uid()
      AND teacher_membership.member_id = teacher_id
      AND teacher_membership.member_role = 'teacher'
  )
  AND EXISTS (
    SELECT 1 FROM public.org_members AS student_membership
    WHERE student_membership.org_id = auth.uid()
      AND student_membership.member_id = student_id
      AND student_membership.member_role = 'student'
  )
);

CREATE POLICY "org admins remove assignments"
ON public.teacher_assignments FOR DELETE TO authenticated
USING (auth.uid() = org_id);