CREATE TABLE public.lesson_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  subject text NOT NULL DEFAULT '',
  lesson jsonb NOT NULL DEFAULT '{}'::jsonb,
  slide_index integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_answer integer,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_sessions TO authenticated;
GRANT ALL ON public.lesson_sessions TO service_role;

ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own lesson sessions" ON public.lesson_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX lesson_sessions_user_updated_idx ON public.lesson_sessions (user_id, updated_at DESC);

CREATE TRIGGER lesson_sessions_set_updated_at
  BEFORE UPDATE ON public.lesson_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();