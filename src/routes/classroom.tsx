import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Send,
  Pause,
  Play,
  NotebookPen,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { lesson, lessonQuiz } from "@/lib/twin-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/classroom")({
  head: () => ({
    meta: [
      { title: "Immersive Classroom — EduTwin AI" },
      {
        name: "description",
        content:
          "An AI classroom that lectures with slides, draws on the board, answers questions live and quizzes you at the end.",
      },
      { property: "og:title", content: "Immersive Classroom — EduTwin AI" },
      {
        property: "og:description",
        content: "Live AI teaching with visual slides, voice mode, notes and an end-of-lesson quiz.",
      },
    ],
  }),
  component: Classroom;
});

type ChatMessage = { role: "user" | "tutor"; text: string };

function Classroom() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [notes, setNotes] = useState("");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "tutor", text: "We're covering black holes today. Stop me any time — literally, just type." },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const slide = lesson.slides[index];
  const atEnd = index === lesson.slides.length - 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!playing || atEnd) return;
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, lesson.slides.length - 1)), 12000);
    return () => clearTimeout(t);
  }, [playing, index, atEnd]);

  const ask = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPlaying(false);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "tutor",
          text: `Good question. Staying on "${slide.title}": ${slide.narration} Want me to redraw it more slowly?`,
        },
      ]);
    }, 700);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="panel overflow-hidden">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 sm:flex sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">{lesson.topic}</h1>
              <p className="text-xs text-muted-foreground">
                {lesson.subject} · Slide {index + 1} of {lesson.slides.length}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground sm:flex">
                <span className="size-1.5 animate-pulse rounded-full bg-mastered" />
                Tutor online
              </span>
              <Button size="sm" variant="outline" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                <span className="ml-1 hidden sm:inline">{playing ? "Pause" : "Resume"}</span>
              </Button>
            </div>
          </header>

          <div className="grid gap-4 p-4 lg:grid-cols-[1.7fr_1fr] lg:p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-bold">{slide.title}</h2>
                <ul className="mt-4 space-y-3">
                  {slide.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid h-48 place-items-center rounded-xl border border-border bg-background">
                  <div className="text-center">
                    <div className="mx-auto grid size-28 place-items-center rounded-full border border-primary/40">
                      <div className="grid size-20 place-items-center rounded-full border border-accent/40">
                        <div className="size-9 rounded-full bg-neural glow" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                      {slide.visual}
                    </p>
                  </div>
                </div>

                <p className="mt-4 rounded-xl border border-border bg-surface-2/60 p-3 text-sm italic leading-relaxed text-muted-foreground">
                  "{slide.narration}"
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <div className="flex gap-1.5">
                    {lesson.slides.map((s, i) => (
                      <button
                        key={s.title}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === index ? "w-6 bg-neural" : "w-1.5 bg-border",
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="bg-neural"
                    disabled={atEnd}
                    onClick={() => setIndex((i) => Math.min(lesson.slides.length - 1, i + 1))}
                  >
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {atEnd && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    End-of-lesson check
                  </p>
                  <h3 className="mt-2 text-base font-semibold">{lessonQuiz.question}</h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {lessonQuiz.options.map((opt, i) => {
                      const chosen = answer === i;
                      const correct = i === lessonQuiz.answerIndex;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(i)}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                            answer === null && "border-border bg-surface-2/60 hover:border-primary/50",
                            answer !== null && correct && "border-mastered/50 bg-mastered/15",
                            answer !== null && chosen && !correct && "border-weak/50 bg-weak/15",
                            answer !== null && !chosen && !correct && "border-border opacity-60",
                          )}
                        >
                          {opt}
                          {answer !== null && correct && (
                            <CircleCheck className="size-4 shrink-0 text-mastered" />
                          )}
                          {answer !== null && chosen && !correct && (
                            <CircleX className="size-4 shrink-0 text-weak" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {answer !== null && (
                    <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">
                      {lessonQuiz.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="flex min-h-[22rem] flex-col rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Ask the tutor</p>
                <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" && "justify-end")}>
                      <p
                        className={cn(
                          "max-w-[85%] text-sm leading-relaxed",
                          m.role === "user"
                            ? "rounded-2xl bg-primary px-3.5 py-2 text-primary-foreground"
                            : "text-foreground/85",
                        )}
                      >
                        {m.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        ask();
                      }
                    }}
                    rows={1}
                    placeholder="I don't understand this…"
                    className="min-h-10 resize-none bg-background"
                  />
                  <Button size="icon" variant="outline" aria-label="Voice mode">
                    <Mic className="size-4" />
                  </Button>
                  <Button size="icon" className="bg-neural" onClick={ask} aria-label="Send">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                  <NotebookPen className="size-3.5" /> Your notes
                </p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Jot anything — your twin folds it into revision."
                  className="mt-3 resize-none bg-background"
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
