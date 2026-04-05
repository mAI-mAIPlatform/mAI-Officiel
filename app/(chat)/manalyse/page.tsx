"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Search, UploadCloud, Image as ImageIcon, FileText, Link as LinkIcon, Download } from "lucide-react";

export default function MAnalysePage() {
  const [url, setUrl] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState("");

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setFileContent("");
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setFileContent(text);
      setImageBase64("");
    }
  };

  const handleAnalyze = async () => {
    if (!url && !fileContent && !imageBase64) return;

    setIsLoading(true);
    setReport("");

    try {
      const res = await fetch("/api/manalyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, fileContext: fileContent, imageBase64 }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      } else {
        setReport(data.error || "Une erreur s'est produite.");
      }
    } catch (e) {
      setReport("Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "rapport-manalyse.txt";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Search className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">mAnalyse</h1>
            <p className="text-sm text-muted-foreground">
              Analysez des URL, fichiers et images pour extraire des rapports structurés.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <LinkIcon className="size-4" /> URL à analyser
          </label>
          <input
            type="url"
            className="w-full rounded-xl border border-border bg-background/60 p-3"
            placeholder="https://example.com/article..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <FileText className="size-4" /> Ou fichier / image
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2 hover:bg-muted/50 transition-colors">
              <UploadCloud className="size-4" />
              <span>Choisir un fichier</span>
              <input type="file" className="hidden" accept=".txt,.json,.md,.csv,image/*" onChange={handleFileUpload} />
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
        </div>

        <Button onClick={handleAnalyze} disabled={isLoading || (!url && !fileContent && !imageBase64)} className="w-full">
          {isLoading ? "Analyse en cours..." : "Lancer l'analyse"}
        </Button>
      </div>

      {report && (
        <div className="rounded-2xl border border-border/50 bg-card/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Rapport d'analyse</h2>
            <Button variant="outline" size="sm" onClick={handleDownload} className="flex gap-2">
              <Download className="size-4" /> Exporter
            </Button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm">{report}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
