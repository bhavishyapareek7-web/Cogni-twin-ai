import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireFeature } from "@/lib/access.server";
import { chat, twinContext } from "@/lib/ai.server";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

/** Ask a question grounded in the learner's own uploaded book/chapter text. */
export const askBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.string().trim().min(1).max(60_000),
        title: z.string().trim().max(160).default("Uploaded material"),
        question: z.string().trim().min(2).max(1000),
        history: z.array(messageSchema).max(12).default([]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireFeature(supabase, userId, "premium_ai_pdf");
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const answer = await chat([
      {
        role: "system",
        content: `You are EduTwin's AI Book Companion. Answer ONLY from the supplied source text; if the answer is not present, say so plainly and offer the closest related idea from the text.
Learner profile:
${twinContext(profile as Record<string, unknown> | null)}

Style: short paragraphs, bold key terms, quote the exact supporting line from the source as "> quote". End with one line starting with "Check:" that asks a quick recall question.

SOURCE TITLE: ${data.title}
SOURCE TEXT:
${data.source.slice(0, 60_000)}`,
      },
      ...data.history,
      { role: "user", content: data.question },
    ]);

    return { answer };
  });

/** Turn the uploaded material into a revision summary saved to notes. */
export const summarizeBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        source: z.string().trim().min(1).max(60_000),
        title: z.string().trim().max(160).default("Uploaded material"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireFeature(supabase, userId, "premium_ai_pdf");
    const summary = await chat([
      {
        role: "system",
        content:
          "Summarize the source into exam-ready revision notes: 5-8 bullet key ideas, then 'Formulas / definitions', then '3 likely exam questions'. Markdown only, no preamble.",
      },
      { role: "user", content: `TITLE: ${data.title}\n\n${data.source.slice(0, 60_000)}` },
    ]);
    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      topic: data.title.slice(0, 120),
      title: `Book notes — ${data.title.slice(0, 100)}`,
      kind: "book",
      content: summary,
    });
    if (error) throw new Error(error.message);
    return { summary };
  });
