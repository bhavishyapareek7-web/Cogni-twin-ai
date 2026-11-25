import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, FileText, Loader2, Send, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { askBook, summarizeBook } from "@/lib/companion.functions";

export const Route = createFileRoute("/_authenticated/companion")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "AI Book Companion — EduTwin AI" },
      {
        name: "description",
        content:
          "Upload a PDF chapter or paste your textbook and ask questions answered only from your own material, with quoted evidence.",
      },
      { property: "og:title", content: "AI Book Companion — EduTwin AI" },
      {
        property: "og:description",
        content: "Ask your own textbook anything — grounded answers with quoted lines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Companion,
});

type Msg = { role: "user" | "assistant"; content: string };

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 40); i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " "),
    );
  }
  return pages.join("\n\n");
}

function Companion() {
  const ask = useServerFn(askBook);
  const summarize = useServerFn(summarizeBook);
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reading, setReading] = useState(false);
  const [summary, setSummary] = useState("");

  const askMutation = useMutation({
    mutationFn: (q: string) =>
      ask({
        data: {
          source,
          title: title || "Uploaded material",
          question: q,
          history: messages.slice(-8),
        },
      }),
    onSuccess: (res, q) =>
      setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: res.answer }]),
    onError: (e: Error) => toast.error(e.message),
  });

  const summaryMutation = useMutation({
    mutationFn: () => summarize({ data: { source, title: title || "Uploaded material" } }),
    onSuccess: (res) => {
      setSummary(res.summary);
      toast.success("Revision notes saved to Revise.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      const text = file.name.toLowerCase().endsWith(".pdf")
        ? await extractPdf(file)
        : await file.text();
      if (!text.trim()) throw new Error("No selectable text found — this PDF may be scanned images.");
      setSource(text.slice(0, 60_000));
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      toast.success(`Loaded ${Math.round(text.length / 1000)}k characters.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setReading(false);
    }
  };

  const ready = source.trim().length > 40;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <header>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <BookOpen className="size-3.5 text-accent" /> AI Book Companion
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Ask <span className="text-gradient">your own textbook</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Upload a PDF chapter or paste text. Answers come only from your material, with the exact
            supporting line quoted back to you.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <section className="panel space-y-3 p-5">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter or book title"
            />
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={reading}
              onClick={() => fileInput.current?.click()}
            >
              {reading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
              {reading ? "Reading file…" : "Upload PDF or text"}
            </Button>
            <Textarea
              value={source}
              onChange={(e) => setSource(e.target.value.slice(0, 60_000))}
              placeholder="…or paste your chapter text here"
              className="min-h-[220px]"
            />
            <p className="text-xs text-muted-foreground">
              {source.length.toLocaleString()} / 60,000 characters loaded
            </p>
            <Button
              className="w-full bg-neural"
              disabled={!ready || summaryMutation.isPending}
              onClick={() => summaryMutation.mutate()}
            >
              {summaryMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Make revision notes
            </Button>
          </section>

          <section className="panel flex min-h-[420px] flex-col p-5">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {!messages.length && !summary && (
                <p className="text-sm text-muted-foreground">
                  Load your material, then ask something like “explain the derivation on page 3” or
                  “what is the difference between the two laws here?”.
                </p>
              )}
              {summary && (
                <article className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    <FileText className="size-3.5" /> Revision notes
                  </p>
                  <div className="whitespace-pre-wrap leading-relaxed">{summary}</div>
                </article>
              )}
              {messages.map((m, i) => (
                <article
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-lg bg-primary/15 p-3 text-sm"
                      : "max-w-[92%] rounded-lg border border-border bg-surface p-3 text-sm"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </article>
              ))}
              {askMutation.isPending && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Reading your material…
                </p>
              )}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const q = question.trim();
                if (!ready) return toast.error("Load a chapter or paste text first.");
                if (!q) return;
                setQuestion("");
                askMutation.mutate(q);
              }}
            >
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this material…"
              />
              <Button type="submit" disabled={askMutation.isPending}>
                <Send className="size-4" />
              </Button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
