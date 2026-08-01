import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).min(2).max(4),
  visual: z.string(),
  narration: z.string(),
});

const lessonSchema = z.object({
  topic: z.string(),
  subject: z.string(),
  slides: z.array(slideSchema).min(3).max(6),
  quiz: z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string(),
  }),
});

export type GeneratedLesson = z.infer<typeof lessonSchema>;

async function callGateway(messages: Array<{ role: string; content: string }>) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3.5-flash", messages }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status})`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return body.choices?.[0]?.message?.content ?? "";
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}

export const generateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { topic: string }) =>
    z.object({ topic: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<GeneratedLesson> => {
    const raw = await callGateway([
      {
        role: "system",
        content:
          "You are a world-class teacher building an immersive slide lecture. Reply with JSON only, no prose, matching exactly: {\"topic\":string,\"subject\":string,\"slides\":[{\"title\":string,\"bullets\":[string,string,string],\"visual\":string,\"narration\":string}],\"quiz\":{\"question\":string,\"options\":[string,string,string,string],\"answerIndex\":number,\"explanation\":string}}. Produce 4 slides. 'visual' is a very short caption for a diagram (max 6 words). 'narration' is one or two spoken sentences with a vivid analogy. Build slides in prerequisite order.",
      },
      { role: "user", content: `Teach me: ${data.topic}` },
    ]);
    return lessonSchema.parse(parseJson(raw));
  });

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { topic: string; slideTitle: string; question: string }) =>
    z
      .object({
        topic: z.string().trim().min(1).max(120),
        slideTitle: z.string().trim().max(160),
        question: z.string().trim().min(1).max(600),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const answer = await callGateway([
      {
        role: "system",
        content:
          "You are EduTwin, a patient live tutor mid-lecture. Answer in at most 4 short sentences, plain language, one concrete analogy, no markdown headings.",
      },
      {
        role: "user",
        content: `Lesson: ${data.topic}. Current slide: ${data.slideTitle}. Student asks: ${data.question}`,
      },
    ]);
    return { answer: answer.trim() };
  });
