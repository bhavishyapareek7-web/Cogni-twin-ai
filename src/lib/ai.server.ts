const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], model = "google/gemini-3.5-flash") {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    throw new Error(`AI request failed (${res.status})`);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return body.choices?.[0]?.message?.content ?? "";
}

export function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const useArray = arrStart >= 0 && (objStart < 0 || arrStart < objStart);
  const start = useArray ? arrStart : objStart;
  const end = useArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}

/** Short natural-language description of the learner, injected into every prompt. */
export function twinContext(p: Record<string, unknown> | null): string {
  if (!p) return "No learner profile yet; assume a motivated general student.";
  const list = (v: unknown) => (Array.isArray(v) && v.length ? v.join(", ") : "unspecified");
  return [
    `Name: ${p["display_name"] ?? "learner"}`,
    `Grade/class: ${p["grade"] ?? "unspecified"} (${p["board"] ?? "board unspecified"})`,
    `Target exams: ${list(p["target_exams"])}`,
    `Subjects: ${list(p["subjects"])}`,
    `Weak: ${list(p["weak_subjects"])}. Strong: ${list(p["strong_subjects"])}`,
    `Learning style: ${p["learning_style"] ?? "mixed"}; explanations: ${p["explanation_style"] ?? "balanced"}`,
    `Language: ${p["language"] ?? "English"}; daily study hours: ${p["daily_hours"] ?? 2}`,
    `Goal: ${p["learning_goal"] ?? "improve steadily"}; exam date: ${p["exam_date"] ?? "not set"}`,
  ].join("\n");
}

/** SM-2-lite scheduling for spaced repetition. */
export function schedule(
  quality: 0 | 1 | 2,
  ease: number,
  intervalDays: number,
): { ease: number; intervalDays: number; dueOn: string } {
  let nextEase = ease;
  let next = intervalDays;
  if (quality === 0) {
    nextEase = Math.max(1.3, ease - 0.2);
    next = 1;
  } else if (quality === 1) {
    next = Math.max(1, Math.round(intervalDays * 1.3));
  } else {
    nextEase = Math.min(3.2, ease + 0.1);
    next = Math.max(2, Math.round(intervalDays * nextEase));
  }
  const due = new Date();
  due.setDate(due.getDate() + next);
  return { ease: nextEase, intervalDays: next, dueOn: due.toISOString().slice(0, 10) };
}
