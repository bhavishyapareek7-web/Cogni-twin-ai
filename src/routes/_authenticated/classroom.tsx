import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
  Loader2,
  Sparkles,
  RotateCcw,
  History,
  Trash2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateLesson, askTutor, type GeneratedLesson } from "@/lib/lesson.functions";
import {
  saveLessonProgress,
  listLessonSessions,
  deleteLessonSession,
  type LessonSession,
} from "@/lib/lesson-progress.functions";
import { lesson as fallbackLesson, lessonQuiz } from "@/lib/twin-data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/classroom")({
  head: () => ({
    meta: [
      { title: "Immersive Classroom — EduTwin AI" },
      {
        name: "description",
        content:
          "Type any topic and get a live AI lecture with slides, a tutor you can interrupt, notes and an end-of-lesson quiz.",
      },
      { property: "og:title", content: "Immersive Classroom — EduTwin AI" },
      {
        property: "og:description",
        content: "Learn anything: AI-generated slides, live tutor chat, notes and a quiz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Classroom,
});

type ChatMessage = { role: "user" | "tutor"; text: string };

const starterLesson: GeneratedLesson = {
  topic: fallbackLesson.topic,
  subject: fallbackLesson.subject,
  slides: fallbackLesson.slides,
  quiz: lessonQuiz,
};

const suggestions = [
  "Anatomy of a black hole",
  "How mRNA vaccines work",
  "Integration by parts",
  "The French Revolution in 10 minutes",
];

function Classroom() {
  const buildLesson = useServerFn(generateLesson);
  const askServer = useServerFn(askTutor);
  const saveProgress = useServerFn(saveLessonProgress);
  const listSessions = useServerFn(listLessonSessions);
  const removeSession = useServerFn(deleteLessonSession);
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<GeneratedLesson>(starterLesson);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [notes, setNotes] = useState("");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "tutor",
      text: `We're covering ${starterLesson.topic.toLowerCase()} today. Stop me any time — literally, just type.`,
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const slide = lesson.slides[index]!;
  const atEnd = index === lesson.slides.length - 1;

  const sessionsQuery = useQuery({
    queryKey: ["lesson-sessions"],
    queryFn: () => listSessions({ data: undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: {
      id: string | null;
      lesson: GeneratedLesson;
      slideIndex: number;
      notes: string;
      messages: ChatMessage[];
      quizAnswer: number | null;
      completed: boolean;
    }) =>
      saveProgress({
        data: {
          id: payload.id,
          topic: payload.lesson.topic,
          subject: payload.lesson.subject,
          lesson: payload.lesson as unknown as Record<string, unknown>,
          slideIndex: payload.slideIndex,
          notes: payload.notes,
          messages: payload.messages,
          quizAnswer: payload.quizAnswer,
          completed: payload.completed,
        },
      }),
    onSuccess: (res) => {
      setSessionId(res.id);
      setSavedAt(new Date());
      void queryClient.invalidateQueries({ queryKey: ["lesson-sessions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSession({ data: { id } }),
    onSuccess: (_r, id) => {
      if (id === sessionId) setSessionId(null);
      void queryClient.invalidateQueries({ queryKey: ["lesson-sessions"] });
    },
    onError: () => toast.error("Couldn't remove that saved lesson."),
  });

  const persist = useCallback(
    (overrides?: Partial<{ slideIndex: number; notes: string; messages: ChatMessage[]; quizAnswer: number | null }>) => {
      saveMutation.mutate({
        id: sessionId,
        lesson,
        slideIndex: overrides?.slideIndex ?? index,
        notes: overrides?.notes ?? notes,
        messages: overrides?.messages ?? messages,
        quizAnswer: overrides?.quizAnswer ?? answer,
        completed: (overrides?.slideIndex ?? index) === lesson.slides.length - 1,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, lesson, index, notes, messages, answer],
  );

  const lessonMutation = useMutation({
    mutationFn: (t: string) => buildLesson({ data: { topic: t } }),
    onSuccess: (next) => {
      setLesson(next);
      setIndex(0);
      setAnswer(null);
      setNotes("");
      setPlaying(true);
      setSessionId(null);
      setSavedAt(null);
      const opening: ChatMessage[] = [
        {
          role: "tutor",
          text: `New lesson ready: ${next.topic}. I'll walk you through it slide by slide — interrupt whenever.`,
        },
      ];
      setMessages(opening);
      saveMutation.mutate({
        id: null,
        lesson: next,
        slideIndex: 0,
        notes: "",
        messages: opening,
        quizAnswer: null,
        completed: false,
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Couldn't build that lesson. Try rephrasing the topic."),
  });

  const tutorMutation = useMutation({
    mutationFn: (question: string) =>
      askServer({ data: { topic: lesson.topic, slideTitle: slide.title, question } }),
    onSuccess: (res) => {
      setMessages((m) => {
        const next: ChatMessage[] = [...m, { role: "tutor", text: res.answer }];
        persist({ messages: next });
        return next;
      });
    },
    onError: () =>
      setMessages((m) => [
        ...m,
        { role: "tutor", text: "I lost my train of thought there — ask me again?" },
      ]),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!playing || atEnd) return;
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, lesson.slides.length - 1)), 12000);
    return () => clearTimeout(t);
  }, [playing, index, atEnd, lesson.slides.length]);

  // Autosave slide position + notes (debounced) once the lesson is tracked.
  useEffect(() => {
    if (!sessionId) return;
    const t = setTimeout(() => persist(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, index, notes, answer]);

  const resume = (s: LessonSession) => {
    setLesson(s.lesson);
    setTopic(s.topic);
    setIndex(Math.min(s.slideIndex, Math.max(0, s.lesson.slides.length - 1)));
    setNotes(s.notes);
    setMessages(
      s.messages.length
        ? s.messages
        : [{ role: "tutor", text: `Back to ${s.topic}. Ask me anything.` }],
    );
    setAnswer(s.quizAnswer);
    setSessionId(s.id);
    setSavedAt(new Date(s.updatedAt));
    setPlaying(false);
    toast.success(`Resumed “${s.topic}” at slide ${Math.min(s.slideIndex, s.lesson.slides.length - 1) + 1}`);
  };

  const teach = (t: string) => {
    const clean = t.trim();
    if (clean.length < 2) {
      toast.error("Give me a topic to teach.");
      return;
    }
    setTopic(clean);
    lessonMutation.mutate(clean);
  };

  const ask = () => {
    const q = input.trim();
    if (!q || tutorMutation.isPending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPlaying(false);
    tutorMutation.mutate(q);
  };

  const sessions = sessionsQuery.data ?? [];



  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        <div className="panel p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5" /> Learn anything
          </p>
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              teach(topic);
            }}
          >
            <Input
              value={topic}
              maxLength={120}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn today? e.g. quantum tunnelling"
              className="bg-background"
            />
            <Button type="submit" className="bg-neural" disabled={lessonMutation.isPending}>
              {lessonMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Building lesson…
                </>
              ) : (
                "Teach me"
              )}
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={lessonMutation.isPending}
                onClick={() => teach(s)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="panel p-4 sm:p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <History className="size-3.5" /> Continue where you left off
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((s) => {
                const total = s.lesson.slides?.length ?? 1;
                const pct = Math.round(((s.slideIndex + 1) / total) * 100);
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-xl border bg-surface p-3",
                      s.id === sessionId ? "border-primary/50" : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          Slide {Math.min(s.slideIndex + 1, total)} of {total}
                          {s.completed ? " · finished" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete saved lesson ${s.topic}`}
                        onClick={() => deleteMutation.mutate(s.id)}
                        className="text-muted-foreground transition-colors hover:text-weak"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-neural" style={{ width: `${pct}%` }} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      disabled={s.id === sessionId}
                      onClick={() => resume(s)}
                    >
                      {s.id === sessionId ? "Current lesson" : "Resume"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}



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
              <div className="relative rounded-2xl border border-border bg-surface p-5">
                {lessonMutation.isPending && (
                  <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-background/70 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-accent" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Designing your lesson on {topic}…
                      </p>
                    </div>
                  </div>
                )}
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
                  <h3 className="mt-2 text-base font-semibold">{lesson.quiz.question}</h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {lesson.quiz.options.map((opt, i) => {
                      const chosen = answer === i;
                      const correct = i === lesson.quiz.answerIndex;
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
                    <>
                      <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm leading-relaxed">
                        {lesson.quiz.explanation}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setAnswer(null);
                          setIndex(0);
                          setPlaying(true);
                        }}
                      >
                        <RotateCcw className="size-4" /> Replay lesson
                      </Button>
                    </>
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
                  {tutorMutation.isPending && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> Thinking…
                    </p>
                  )}
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
                  <Button
                    size="icon"
                    className="bg-neural"
                    onClick={ask}
                    disabled={tutorMutation.isPending}
                    aria-label="Send"
                  >
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
