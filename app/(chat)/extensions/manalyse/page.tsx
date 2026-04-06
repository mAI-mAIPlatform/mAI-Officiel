"use client";

import { Loader2, ScanSearch } from "lucide-react";
import { useState } from "react";

type ReportPayload = {
  summary: string;
  keyPoints: string[];
  sentiment: {
    label: "positif" | "négatif" | "neutre";
    confidence: number;
    rationale: string;
  };
  conclusion: string;
  rawTextLength: number;
};

export default function MAnalysePage() {
  const [sourceType, setSourceType] = useState<"url" | "file">("url");
  const [targetUrl, setTargetUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const handleAnalyse = async () => {
    setIsLoading(true);
    setReport(null);

    const payload = new FormData();
    payload.set("sourceType", sourceType);

    if (sourceType === "url") {
      payload.set("targetUrl", targetUrl);
    }
    if (sourceType === "file" && file) {
      payload.set("uploadedFile", file);
    }

    const response = await fetch("/api/extensions/manalyse", {
      method: "POST",
      body: payload,
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setNotes([data.error ?? "Analyse indisponible."]);
      return;
    }

    setReport(data.report);
    setNotes(data.notes ?? []);
  };

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ScanSearch className="size-6 text-primary" /> mAnalyse
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Analysez une URL ou un fichier (PDF, TXT, DOCX, PNG, JPG) puis obtenez
          un rapport structuré: résumé, points clés, sentiment, conclusion.
        </p>
      </header>

      <section className="liquid-glass rounded-2xl p-5">
        <div className="mb-3 flex gap-2 text-sm">
          <button
            className={`rounded-full px-3 py-1 ${
              sourceType === "url"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
            onClick={() => setSourceType("url")}
            type="button"
          >
            URL
          </button>
          <button
            className={`rounded-full px-3 py-1 ${
              sourceType === "file"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
            onClick={() => setSourceType("file")}
            type="button"
          >
            Fichier / Image
          </button>
        </div>

        {sourceType === "url" ? (
          <input
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
            onChange={(event) => setTargetUrl(event.target.value)}
            placeholder="https://..."
            value={targetUrl}
          />
        ) : (
          <input
            accept=".txt,.pdf,.docx,image/png,image/jpeg"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        )}

        <button
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          disabled={isLoading}
          onClick={handleAnalyse}
          type="button"
        >
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Lancer l'analyse
        </button>
      </section>

      {notes.length > 0 && (
        <section className="liquid-glass rounded-2xl p-4 text-sm text-muted-foreground">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Notes</h2>
          <ul className="list-disc space-y-1 pl-5">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {report && (
        <section className="liquid-glass space-y-4 rounded-2xl p-5 text-sm">
          <div>
            <h2 className="font-semibold">Résumé</h2>
            <p className="text-muted-foreground">{report.summary}</p>
          </div>
          <div>
            <h2 className="font-semibold">Points clés</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {report.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">Analyse de sentiment</h2>
            <p className="text-muted-foreground">
              {report.sentiment.label} (
              {Math.round(report.sentiment.confidence * 100)}%) —{" "}
              {report.sentiment.rationale}
            </p>
          </div>
          <div>
            <h2 className="font-semibold">Conclusion</h2>
            <p className="text-muted-foreground">{report.conclusion}</p>
          </div>
        </section>
      )}
    </div>
  );
}
