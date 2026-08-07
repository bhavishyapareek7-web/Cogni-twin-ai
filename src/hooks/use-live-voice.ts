import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Live classroom voice: the tutor speaks (speechSynthesis) and the learner can
 * raise a hand and ask verbally (SpeechRecognition). Browser-only.
 */
export function useLiveVoice() {
  const [supported, setSupported] = useState({ speak: false, listen: false });
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported({ speak: canSpeak, listen: !!getRecognitionCtor() });
    if (!canSpeak) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => /en-(GB|US)/i.test(v.lang) && /natural|google|samantha|aria/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        voices[0] ??
        null;
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = 0.98;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onDone?.();
      };
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  /** Raise hand: mute the tutor and capture a spoken question. */
  const listen = useCallback(
    (onFinal: (text: string) => void, onError?: (message: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        onError?.("Your browser can't do voice input — try Chrome.");
        return;
      }
      stopSpeaking();
      recognitionRef.current?.abort();
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      let finalText = "";
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
          else interim += result[0].transcript;
        }
        setTranscript((finalText + interim).trim());
      };
      recognition.onerror = (event: any) => {
        setListening(false);
        onError?.(
          event?.error === "not-allowed"
            ? "Microphone blocked — allow mic access to ask verbally."
            : "I didn't catch that. Try again.",
        );
      };
      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
        const clean = finalText.trim();
        setTranscript("");
        if (clean) onFinal(clean);
      };
      recognitionRef.current = recognition;
      setTranscript("");
      setListening(true);
      recognition.start();
    },
    [stopSpeaking],
  );

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );

  return { supported, speaking, listening, transcript, speak, stopSpeaking, listen, stopListening };
}
