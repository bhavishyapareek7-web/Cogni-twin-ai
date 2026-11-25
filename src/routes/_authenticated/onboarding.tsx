import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTwin, saveOnboarding } from "@/lib/twin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Set up your AI Twin — EduTwin AI" },
      {
        name: "description",
        content:
          "Tell your twin your grade, board, target exams, weak subjects and learning style so every lesson, test and plan is personalised.",
      },
      { property: "og:title", content: "Set up your AI Twin — EduTwin AI" },
      {
        property: "og:description",
        content: "A two-minute setup that personalises every lesson, test and study plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const EXAMS = ["JEE", "NEET", "UPSC", "CAT", "SAT", "GRE", "GMAT", "CBSE Boards", "IGCSE", "SSC"];
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Economics",
  "Computer Science",
];
const STYLES = ["Visual", "Story-driven", "Formal & precise", "Practice-first"];
const EXPLAIN = ["Beginner analogies", "Balanced", "Advanced & rigorous"];
const LANGS = ["English", "Hindi", "Hinglish", "Tamil", "Telugu", "Bengali"];

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              on
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Pick({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return <Chips options={options} value={value ? [value] : []} onChange={(v) => onChange(v.at(-1) ?? "")} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const load = useServerFn(getTwin);
  const { data: twin } = useQuery({ queryKey: ["twin"], queryFn: () => load({}) });

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [weak, setWeak] = useState<string[]>([]);
  const [strong, setStrong] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [explain, setExplain] = useState("Balanced");
  const [language, setLanguage] = useState("English");
  const [hours, setHours] = useState("2");
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    const p = twin?.profile;
    if (!p) return;
    setName((n) => n || p.display_name || "");
    setGrade((v) => v || p.grade || "");
    setBoard((v) => v || p.board || "");
    setSubjects((v) => (v.length ? v : (p.subjects ?? [])));
    setExams((v) => (v.length ? v : (p.target_exams ?? [])));
    setWeak((v) => (v.length ? v : (p.weak_subjects ?? [])));
    setStrong((v) => (v.length ? v : (p.strong_subjects ?? [])));
    setStyle((v) => v || p.learning_style || "");
    setGoal((v) => v || p.learning_goal || "");
  }, [twin?.profile]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          display_name: name.trim() || "Learner",
          age: age ? Number(age) : null,
          grade,
          board,
          subjects,
          target_exams: exams,
          weak_subjects: weak,
          strong_subjects: strong,
          learning_style: style,
          explanation_style: explain,
          language,
          daily_hours: Number(hours) || 2,
          learning_goal: goal.trim(),
          exam_date: examDate || null,
        },
      }),
    onSuccess: () => {
      toast.success("Your twin is calibrated.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save your setup."),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-3.5" /> Twin calibration
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Teach your twin about <span className="text-gradient">you</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything here shapes your lessons, tests, notes and weekly strategy. You can change it
            any time.
          </p>
        </div>

        <form
          className="panel space-y-6 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-2 bg-background"
              />
            </Field>
            <Field label="Age">
              <Input
                value={age}
                type="number"
                min={5}
                max={99}
                onChange={(e) => setAge(e.target.value)}
                placeholder="17"
                className="mt-2 bg-background"
              />
            </Field>
            <Field label="Grade / class">
              <Input
                value={grade}
                maxLength={40}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Class 12"
                className="mt-2 bg-background"
              />
            </Field>
            <Field label="Board / university">
              <Input
                value={board}
                maxLength={40}
                onChange={(e) => setBoard(e.target.value)}
                placeholder="CBSE"
                className="mt-2 bg-background"
              />
            </Field>
          </div>

          <Field label="Subjects you study">
            <Chips options={SUBJECTS} value={subjects} onChange={setSubjects} />
          </Field>
          <Field label="Target exams">
            <Chips options={EXAMS} value={exams} onChange={setExams} />
          </Field>
          <Field label="Weak subjects">
            <Chips options={SUBJECTS} value={weak} onChange={setWeak} />
          </Field>
          <Field label="Strong subjects">
            <Chips options={SUBJECTS} value={strong} onChange={setStrong} />
          </Field>
          <Field label="Learning style">
            <Pick options={STYLES} value={style} onChange={setStyle} />
          </Field>
          <Field label="Preferred explanations">
            <Pick options={EXPLAIN} value={explain} onChange={setExplain} />
          </Field>
          <Field label="Language">
            <Pick options={LANGS} value={language} onChange={setLanguage} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Daily study hours">
              <Input
                value={hours}
                type="number"
                step="0.5"
                min={0.5}
                max={16}
                onChange={(e) => setHours(e.target.value)}
                className="mt-2 bg-background"
              />
            </Field>
            <Field label="Exam date">
              <Input
                value={examDate}
                type="date"
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-2 bg-background"
              />
            </Field>
          </div>

          <Field label="Your goal">
            <Textarea
              value={goal}
              maxLength={300}
              rows={3}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Crack JEE Main with 99+ percentile while keeping board marks above 90%."
              className="mt-2 resize-none bg-background"
            />
          </Field>

          <Button type="submit" className="w-full bg-neural" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Calibrating…
              </>
            ) : (
              "Save & meet my twin"
            )}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
