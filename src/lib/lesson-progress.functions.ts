import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GeneratedLesson } from "@/lib/lesson.functions";

export type LessonSession = {
  id: string;
  topic: string;
  subject: string;
  lesson: GeneratedLesson;
  slideIndex: number;
  notes: string;
  messages: Array<{ role: "user" | "tutor"; text: string }>;
  quizAnswer: number | null;
  completed: boolean;
  updatedAt: string;
};

export const saveLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().nullish(),
        topic: z.string().trim().min(1).max(160),
        subject: z.string().max(160).default(""),
        lesson: z.record(z.string(), z.unknown()),
        slideIndex: z.number().int().min(0).max(50),
        notes: z.string().max(20000).default(""),
        messages: z
          .array(z.object({ role: z.enum(["user", "tutor"]), text: z.string().max(4000) }))
          .max(200)
          .default([]),
        quizAnswer: z.number().int().min(0).max(3).nullish(),
        completed: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      topic: data.topic,
      subject: data.subject,
      lesson: data.lesson,
      slide_index: data.slideIndex,
      notes: data.notes,
      messages: data.messages,
      quiz_answer: data.quizAnswer ?? null,
      completed: data.completed,
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("lesson_sessions")
        .update(row)
        .eq("id", data.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: updated.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("lesson_sessions")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const listLessonSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LessonSession[]> => {
    const { data, error } = await context.supabase
      .from("lesson_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      topic: r.topic,
      subject: r.subject,
      lesson: r.lesson as unknown as GeneratedLesson,
      slideIndex: r.slide_index,
      notes: r.notes,
      messages: (r.messages as unknown as LessonSession["messages"]) ?? [],
      quizAnswer: r.quiz_answer,
      completed: r.completed,
      updatedAt: r.updated_at,
    }));
  });

export const deleteLessonSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("lesson_sessions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
