import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Phone, Wind } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wellbeing")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Wellbeing Space — EduTwin AI" },
      {
        name: "description",
        content:
          "A calm corner of EduTwin AI: guided breathing, mood check-ins and helplines for when exam stress gets heavy.",
      },
      { property: "og:title", content: "Wellbeing Space — EduTwin AI" },
      {
        property: "og:description",
        content: "Breathe, check in with yourself, and find help when you need it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WellbeingPage,
});

const BREATH_STEPS = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 6 },
] as const;

const MOODS = [
  { id: "great", label: "Great", emoji: "😄" },
  { id: "okay", label: "Okay", emoji: "🙂" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "stressed", label: "Stressed", emoji: "😟" },
  { id: "low", label: "Low", emoji: "😔" },
] as const;

function WellbeingPage() {
  const [breathing, setBreathing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number>(BREATH_STEPS[0].seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!breathing) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c > 1) return c - 1;
        setStepIndex((s) => {
          const next = (s + 1) % BREATH_STEPS.length;
          setCountdown(BREATH_STEPS[next].seconds);
          return next;
        });
        return BREATH_STEPS[(stepIndex + 1) % BREATH_STEPS.length].seconds;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breathing, stepIndex]);

  const step = BREATH_STEPS[stepIndex];

  const checkIn = async (mood: (typeof MOODS)[number]) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("twin_memory").insert({
      user_id: data.user.id,
      kind: "mood",
      note: `Mood check-in: ${mood.label}`,
    });
    if (error) {
      toast.error("Could not save your check-in");
      return;
    }
    toast.success(
      mood.id === "stressed" || mood.id === "low"
        ? "Noted. Be kind to yourself today — a short walk or the breathing exercise can help."
        : "Noted. Your twin will keep today’s mood in mind.",
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-neural glow">
            <HeartHandshake className="size-5 text-primary-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wellbeing Space</h1>
            <p className="text-sm text-muted-foreground">
              Exams matter. So do you. Take a minute for yourself.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="panel flex flex-col items-center p-6 text-center">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Wind className="size-4 text-accent" /> Guided breathing
            </h2>
            <div
              className={cn(
                "grid size-40 place-items-center rounded-full border border-border bg-secondary/40 transition-transform duration-1000",
                breathing && step.label === "Breathe in" && "scale-125",
                breathing && step.label === "Hold" && "scale-125",
              )}
            >
              {breathing ? (
                <div>
                  <p className="text-lg font-semibold">{step.label}</p>
                  <p className="text-3xl font-bold text-accent">{countdown}</p>
                </div>
              ) : (
                <p className="px-6 text-sm text-muted-foreground">
                  4 seconds in, 4 hold, 6 out
                </p>
              )}
            </div>
            <Button
              className="mt-5 bg-neural"
              onClick={() => {
                setStepIndex(0);
                setCountdown(BREATH_STEPS[0].seconds);
                setBreathing((b) => !b);
              }}
            >
              {breathing ? "Stop" : "Start breathing"}
            </Button>
          </section>

          <section className="panel p-6">
            <h2 className="mb-3 text-sm font-semibold">How are you feeling right now?</h2>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => void checkIn(mood)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary/30 px-2 py-3 transition-colors hover:bg-secondary/60"
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your twin remembers how you felt and adjusts your study plan — lighter on hard days.
            </p>
          </section>
        </div>

        <section className="panel mt-6 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Phone className="size-4 text-accent" /> If things feel too heavy
          </h2>
          <p className="text-sm text-muted-foreground">
            Talking to someone helps. These free, confidential helplines are available in India:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <span className="font-medium">KIRAN (Govt. of India)</span> — 1800-599-0019, free,
              24×7, multiple languages
            </li>
            <li>
              <span className="font-medium">Tele-MANAS</span> — 14416, free, 24×7 mental health
              support
            </li>
            <li>
              <span className="font-medium">AASRA</span> — +91-9820466726, 24×7
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
