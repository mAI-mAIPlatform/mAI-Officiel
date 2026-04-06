"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Download, Copy, Check } from "lucide-react";

export default function Ecri20Page() {
  const [tone, setTone] = useState("Professionnel");
  const [format, setFormat] = useState("Email");
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setCompletion("");

    try {
      const response = await fetch("/api/ecri20", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, tone, format }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2));
                assistantContent += text;
                setCompletion(assistantContent);
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: "txt" | "json" | "docx" | "pdf") => {
    if (!completion) return;

    if (type === "txt" || type === "json") {
      let content = completion;
      let mimeType = "text/plain;charset=utf-8";

      if (type === "json") {
        content = JSON.stringify({ content: completion, format, tone, date: new Date().toISOString() }, null, 2);
        mimeType = "application/json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redaction-ecri20.${type}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const response = await fetch("/api/export/document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: completion, format: type, type: format, tone }),
        });

        if (!response.ok) throw new Error("Export failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `redaction-ecri20.${type}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export error", error);
        alert("Une erreur est survenue lors de l'exportation du document.");
      }
    }
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <PenTool className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Ecri20</h1>
            <p className="text-sm text-muted-foreground">
              IA de rédaction augmentée. Définissez vos idées, choisissez le ton et le format.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-5 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/70 p-5">
          <h2 className="text-xl font-bold">Paramètres</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ton de la rédaction</label>
            <select
              className="w-full rounded-xl border border-border bg-background/60 p-3"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="Professionnel">💼 Professionnel</option>
              <option value="Amical">👋 Amical</option>
              <option value="Créatif">🎨 Créatif</option>
              <option value="Chill">😎 Chill</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format cible</label>
            <select
              className="w-full rounded-xl border border-border bg-background/60 p-3"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="Post LinkedIn">📱 Post LinkedIn</option>
              <option value="Email">📧 Email</option>
              <option value="Chapitre de roman">📖 Chapitre de roman</option>
              <option value="Essai académique">🎓 Essai académique</option>
            </select>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 flex-1 flex flex-col mt-4">
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-sm font-medium">Instructions ou idées de base</label>
              <textarea
                className="w-full flex-1 min-h-[150px] rounded-xl border border-border bg-background/60 p-3 resize-none"
                placeholder="Ex: Rédige une invitation pour un webinaire sur l'intelligence artificielle..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !input} className="w-full">
              {isLoading ? "Génération..." : "Rédiger le texte"}
            </Button>
          </form>
        </div>

        <div className="md:col-span-7 flex flex-col rounded-2xl border border-border/50 bg-card/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Résultat généré</h2>
            <div className="flex items-center gap-2">
              {completion && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                  <select
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleExport(e.target.value as any);
                        e.target.value = ""; // reset
                      }
                    }}
                  >
                    <option value="">Exporter...</option>
                    <option value="txt">.txt (Texte)</option>
                    <option value="json">.json (Données)</option>
                    <option value="docx">.docx (Simulé)</option>
                    <option value="pdf">.pdf (Simulé)</option>
                  </select>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-background/60 p-4 min-h-[400px] overflow-y-auto whitespace-pre-wrap">
            {completion || <span className="text-muted-foreground italic">Le texte généré apparaîtra ici...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
