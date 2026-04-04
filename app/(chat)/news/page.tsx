"use client";

import { Download, Newspaper, SendHorizonal, UploadCloud } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Result = { link: string; snippet: string; source: string; title: string };

type ReportHistory = { createdAt: string; query: string; report: string };

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [externalContext, setExternalContext] = useState("");
  const [history, setHistory] = useState<ReportHistory[]>([]);

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setExternalContext(text.slice(0, 2500));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/news/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContext: externalContext, query }),
      });
      const payload = await response.json();

      setResults(payload.organicResults ?? []);
      setReport(payload.report ?? payload.error ?? "Aucun rapport généré");
      if (payload.report) {
        setHistory((prev) => [
          {
            createdAt: new Date().toISOString(),
            query,
            report: payload.report,
          },
          ...prev,
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reportAsBlob = useMemo(
    () => new Blob([report], { type: "text/plain;charset=utf-8" }),
    [report]
  );

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-5 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Newspaper className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Actualités (mAINews)</h1>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="h-11 flex-1 rounded-xl border border-border bg-background/60 px-3"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une actualité avec assistance IA..."
            value={query}
          />
          <Button disabled={isLoading} onClick={handleSearch}>
            {isLoading ? "Recherche..." : "Rechercher"}
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3">
            <UploadCloud className="size-4" /> Importer un fichier
            <input className="hidden" onChange={handleImportFile} type="file" />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
          <h2 className="mb-2 font-semibold">Résultats Web (mSearch)</h2>
          <div className="space-y-3 text-sm">
            {results.map((item) => (
              <a
                className="block rounded-lg border border-border/50 p-3 hover:bg-muted/40"
                href={item.link}
                key={item.link}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.snippet}</p>
              </a>
            ))}
            {results.length === 0 && (
              <p className="text-muted-foreground">
                Aucun résultat pour le moment.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Rapport de synthèse</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const url = URL.createObjectURL(reportAsBlob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "rapport-actualites.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                size="sm"
                variant="outline"
              >
                <Download className="mr-1 size-4" />
                Télécharger
              </Button>
              <Button size="sm" variant="outline">
                <SendHorizonal className="mr-1 size-4" />
                Envoyer
              </Button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-background/70 p-3 text-xs">
            {report || "La synthèse complète sera affichée ici."}
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <h3 className="mb-2 font-semibold">Historique des rapports</h3>
        <div className="space-y-2 text-sm">
          {history.map((item, index) => (
            <div
              className="rounded-lg border border-border/50 p-3"
              key={`${item.createdAt}-${index}`}
            >
              <p className="font-medium">{item.query}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-muted-foreground">
              Aucun historique disponible.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
