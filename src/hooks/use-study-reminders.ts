import { useEffect } from "react";
import { toast } from "sonner";

const WATER_KEY = "edutwin:last-water-reminder";
const STUDY_KEY = "edutwin:last-study-reminder";
const WATER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const STUDY_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const TICK_MS = 60 * 1000;

function readTs(key: string): number {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

/**
 * Gentle health reminders for signed-in learners:
 * a water nudge every 30 minutes and a study nudge every 2 hours.
 * Timestamps persist in localStorage so reminders survive reloads.
 */
export function useStudyReminders(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const now = Date.now();
      if (now - readTs(WATER_KEY) >= WATER_INTERVAL_MS) {
        window.localStorage.setItem(WATER_KEY, String(now));
        toast("💧 Time to drink some water", {
          description: "A hydrated brain learns faster. Grab a glass!",
        });
      }
      if (now - readTs(STUDY_KEY) >= STUDY_INTERVAL_MS) {
        window.localStorage.setItem(STUDY_KEY, String(now));
        toast("📚 Two hours since your last study nudge", {
          description: "A short focused session in the classroom keeps your streak alive.",
        });
      }
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [enabled]);
}
