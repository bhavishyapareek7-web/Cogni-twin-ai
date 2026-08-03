import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chat, parseJson, schedule, twinContext } from "@/lib/ai.server";

export const getTwin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const [profile, memory, cards, tests, plan] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("twin_memory")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("flashcards").select("*").lte("due_on", today).order("due_on").limit(40),
      supabase.from("mock_tests").select("*").order("created_at", { ascending: false }).limit(5),
      supabase
        .from("study_plans")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      profile: profile.data,
      memory: memory.data ?? [],
      dueCards: cards.data ?? [],
      tests: tests.data ?? [],
      plan: plan.data,
    };
  });

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().trim().min(1).max(80),
        age: z.number().int().min(5).max(99).nullable(),
        grade: z.string().trim().max(40),
        board: z.string().trim().max(40),
        subjects: z.array(z.string().max(40)).max(20),
        target_exams: z.array(z.string().max(40)).max(20),
        weak_subjects: z.array(z.string().max(40)).max(20),
        strong_subjects: z.array(z.string().max(40)).max(20),
        learning_style: z.string().max(40),
        explanation_style: z.string().max(40),
        language: z.string().max(40),
        daily_hours: z.number().min(0.5).max(16),
        learning_goal: z.string().trim().max(300),
        exam_date: z.string().max(20).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, exam_date: data.exam_date || null, onboarded: true })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    await supabase.from("twin_memory").insert({
      user_id: userId,
      kind: "onboarding",
      note: `Learner set up their twin: goal "${data.learning_goal}", weak in ${data.weak_subjects.join(", ") || "nothing declared"}, prefers ${data.learning_style || "mixed"} learning.`,
    });
    return { ok: true };
  });

export const awardXp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ amount: z.number().int().min(1).max(500), reason: z.string().max(160) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("profiles")
      .select("xp, streak_days, last_active_on")
      .eq("id", userId)
      .maybeSingle();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    const last = p?.last_active_on ?? null;
    const streak =
      last === todayStr
        ? (p?.streak_days ?? 1)
        : last === yesterday
          ? (p?.streak_days ?? 0) + 1
          : 1;
    const xp = (p?.xp ?? 0) + data.amount;
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    await supabase
      .from("profiles")
      .update({ xp, level, streak_days: streak, last_active_on: todayStr })
      .eq("id", userId);
    return { xp, level, streak };
  });

export const solveDoubt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().trim().min(3).max(2000),
        mode: z.enum(["hints", "full"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const raw = await chat([
      {
        role: "system",
        content: `You are EduTwin's homework coach. Learner profile:\n${twinContext(profile as Record<string, unknown> | null)}\n\nReply with JSON only: {"restated":string,"steps":[{"title":string,"detail":string}],"answer":string,"pitfall":string,"concept":string}. ${
          data.mode === "hints"
            ? 'Give guiding hints only: each step nudges without revealing the result, and "answer" must be "Try it now — reveal the full solution when you are stuck."'
            : "Give the complete worked solution with the final answer."
        } Use 3-5 steps, plain language, one concrete analogy where useful.`,
      },
      { role: "user", content: data.question },
    ]);
    const parsed = z
      .object({
        restated: z.string(),
        steps: z.array(z.object({ title: z.string(), detail: z.string() })).min(1),
        answer: z.string(),
        pitfall: z.string(),
        concept: z.string(),
      })
      .parse(parseJson(raw));
    await supabase.from("twin_memory").insert({
      user_id: userId,
      kind: "doubt",
      topic: parsed.concept,
      note: `Asked for help on: ${data.question.slice(0, 180)}`,
    });
    return parsed;
  });

export const generateStudyPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(2).max(120),
        kind: z.enum(["notes", "formula_sheet", "mnemonics", "mind_map"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const styleHint: Record<string, string> = {
      notes: "crisp revision notes with short headed sections and bullet lines",
      formula_sheet: "a formula sheet: every line is a formula plus when to use it",
      mnemonics: "memory tricks, mnemonics and vivid hooks",
      mind_map: "a nested indented mind map using '-' levels only",
    };
    const raw = await chat([
      {
        role: "system",
        content: `You are EduTwin's notes generator. Learner profile:\n${twinContext(profile as Record<string, unknown> | null)}\n\nReply with JSON only: {"title":string,"content":string,"flashcards":[{"front":string,"back":string}]}. "content" is markdown-free plain text formatted as ${styleHint[data.kind]}, under 250 words. Produce exactly 6 flashcards testing active recall.`,
      },
      { role: "user", content: `Topic: ${data.topic}` },
    ]);
    const parsed = z
      .object({
        title: z.string(),
        content: z.string(),
        flashcards: z.array(z.object({ front: z.string(), back: z.string() })).min(1),
      })
      .parse(parseJson(raw));

    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        topic: data.topic,
        title: parsed.title,
        kind: data.kind,
        content: parsed.content,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("flashcards").insert(
      parsed.flashcards.slice(0, 12).map((c) => ({
        user_id: userId,
        topic: data.topic,
        front: c.front,
        back: c.back,
      })),
    );
    return { note, cards: parsed.flashcards.length };
  });

export const listStudyPacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

export const reviewCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), quality: z.union([z.literal(0), z.literal(1), z.literal(2)]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: card } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!card) throw new Error("Card not found");
    const next = schedule(data.quality, Number(card.ease), card.interval_days);
    await supabase
      .from("flashcards")
      .update({
        ease: next.ease,
        interval_days: next.intervalDays,
        due_on: next.dueOn,
        reviews: card.reviews + 1,
      })
      .eq("id", data.id);
    if (data.quality === 0) {
      await supabase.from("twin_memory").insert({
        user_id: userId,
        kind: "forgot",
        topic: card.topic,
        note: `Forgot a card on ${card.topic}: "${card.front.slice(0, 120)}"`,
        confidence: 0.3,
      });
    }
    return { dueOn: next.dueOn, intervalDays: next.intervalDays };
  });

export const generateMockTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        exam: z.string().trim().min(1).max(40),
        topic: z.string().trim().min(2).max(120),
        count: z.number().int().min(3).max(15),
        difficulty: z.enum(["easy", "medium", "hard", "exam", "olympiad"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const raw = await chat([
      {
        role: "system",
        content: `You are EduTwin's exam engine building a ${data.exam} style test. Learner profile:\n${twinContext(profile as Record<string, unknown> | null)}\n\nReply with JSON only: {"questions":[{"question":string,"options":[string,string,string,string],"answerIndex":number,"explanation":string,"subtopic":string}]}. Exactly ${data.count} single-correct MCQs at ${data.difficulty} level on the given topic. Vary subtopics. Explanations under 40 words.`,
      },
      { role: "user", content: `Topic: ${data.topic}` },
    ]);
    return z
      .object({
        questions: z
          .array(
            z.object({
              question: z.string(),
              options: z.array(z.string()).length(4),
              answerIndex: z.number().int().min(0).max(3),
              explanation: z.string(),
              subtopic: z.string(),
            }),
          )
          .min(1),
      })
      .parse(parseJson(raw));
  });

export const submitMockTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        exam: z.string().max(40),
        topic: z.string().max(120),
        correct: z.number().int().min(0),
        wrong: z.number().int().min(0),
        skipped: z.number().int().min(0),
        seconds: z.number().int().min(0),
        weakSubtopics: z.array(z.string().max(80)).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const attempted = data.correct + data.wrong;
    const total = (attempted + data.skipped) * 4;
    const score = data.correct * 4 - data.wrong;
    const accuracy = attempted ? Math.round((data.correct / attempted) * 100) : 0;
    const ratio = total ? Math.max(0, score) / total : 0;
    const percentile = Math.min(99.9, Math.round(ratio * 98 * 10) / 10);
    const rankLow = Math.max(1, Math.round((100 - percentile) * 1000 * 0.8));
    const rankHigh = Math.max(rankLow + 200, Math.round((100 - percentile) * 1000 * 1.25));
    const { data: row, error } = await supabase
      .from("mock_tests")
      .insert({
        user_id: userId,
        exam: data.exam,
        topic: data.topic,
        score,
        total,
        accuracy,
        predicted_percentile: percentile,
        rank_low: rankLow,
        rank_high: rankHigh,
        analysis: {
          correct: data.correct,
          wrong: data.wrong,
          skipped: data.skipped,
          seconds: data.seconds,
          weakSubtopics: data.weakSubtopics,
        },
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.weakSubtopics.length) {
      await supabase.from("twin_memory").insert({
        user_id: userId,
        kind: "mistake",
        topic: data.topic,
        note: `Lost marks in ${data.exam} test on ${data.topic}: ${data.weakSubtopics.slice(0, 5).join(", ")}`,
        confidence: accuracy / 100,
      });
    }
    return row;
  });

export const rewriteStrategy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: memory }, { data: tests }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("twin_memory").select("kind, topic, note").order("created_at", { ascending: false }).limit(20),
      supabase.from("mock_tests").select("exam, topic, accuracy, predicted_percentile").order("created_at", { ascending: false }).limit(5),
    ]);
    const raw = await chat([
      {
        role: "system",
        content: `You are EduTwin's study strategist. Learner profile:\n${twinContext(profile as Record<string, unknown> | null)}\n\nRecent twin memory: ${JSON.stringify(memory ?? [])}\nRecent tests: ${JSON.stringify(tests ?? [])}\n\nReply with JSON only: {"rationale":string,"expected_gain":string,"days":[{"day":string,"focus":string,"blocks":[{"time":string,"task":string,"why":string}]}]}. Exactly 7 days starting Monday, 2-3 blocks per day, each block under 18 words. Weight time toward weak areas and recent mistakes; schedule recall sessions in the evening.`,
      },
      { role: "user", content: "Rewrite my week." },
    ]);
    const parsed = z
      .object({
        rationale: z.string(),
        expected_gain: z.string(),
        days: z
          .array(
            z.object({
              day: z.string(),
              focus: z.string(),
              blocks: z.array(z.object({ time: z.string(), task: z.string(), why: z.string() })),
            }),
          )
          .min(1),
      })
      .parse(parseJson(raw));
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    await supabase.from("study_plans").delete().eq("user_id", userId).eq("week_start", weekStart);
    const { data: row, error } = await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        week_start: weekStart,
        plan: { days: parsed.days, expected_gain: parsed.expected_gain },
        rationale: parsed.rationale,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
