"use client";

import {
  ArrowLeftRight,
  BookOpen,
  Languages,
  RefreshCcw,
  SendHorizonal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const languageOptions = [
  { code: "auto", label: "Détection auto" },
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "es", label: "Espagnol" },
  { code: "de", label: "Allemand" },
  { code: "ar", label: "Arabe" },
  { code: "it", label: "Italien" },
  { code: "pt", label: "Portugais" },
  { code: "nl", label: "Néerlandais" },
  { code: "pl", label: "Polonais" },
  { code: "tr", label: "Turc" },
  { code: "sv", label: "Suédois" },
  { code: "ru", label: "Russe" },
  { code: "ja", label: "Japonais" },
  { code: "ko", label: "Coréen" },
  { code: "zh", label: "Chinois" },
] as const;

const synonymsMap: Record<string, string[]> = {
  bug: ["anomalie", "défaut", "erreur"],
  rapide: ["vite", "prompt", "expéditif"],
  code: ["script", "source", "implémentation"],
  sécurité: ["protection", "fiabilité", "robustesse"],
  translation: ["traduction", "interprétation", "localisation"],
};

const detectorPatterns = {
  fr: /\b(le|la|les|des|une|être|avec|pour)\b/giu,
  en: /\b(the|and|with|for|this|that|are)\b/giu,
  es: /\b(el|la|los|las|una|para|con|que)\b/giu,
  de: /\b(der|die|das|mit|und|ist|für)\b/giu,
  it: /\b(il|lo|gli|che|per|con|una)\b/giu,
  pt: /\b(o|a|os|as|com|para|que|uma)\b/giu,
};

function detectLanguage(text: string) {
  const normalized = text.toLowerCase();
  if (!normalized.trim()) {
    return "auto";
  }

  let topCode = "en";
  let topScore = -1;

  for (const [code, pattern] of Object.entries(detectorPatterns)) {
    const matches = normalized.match(pattern)?.length ?? 0;
    if (matches > topScore) {
      topScore = matches;
      topCode = code;
    }
  }

  return topScore <= 0 ? "en" : topCode;
}

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [aiLexicalAnalysis, setAiLexicalAnalysis] = useState("");
  const [isGeneratingLexicalAnalysis, setIsGeneratingLexicalAnalysis] =
    useState(false);

  const detectedLanguage = useMemo(
    () => detectLanguage(sourceText),
    [sourceText]
  );

  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const sourceLang =
          sourceLanguage === "auto" ? detectedLanguage : sourceLanguage;
        const langPair = `${sourceLang}|${targetLanguage}`;
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${langPair}`
        );
        const payload = await response.json();
        setTranslatedText(payload?.responseData?.translatedText ?? "");
      } catch {
        setTranslatedText("La traduction a échoué. Vérifiez votre connexion.");
      } finally {
        setIsTranslating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [detectedLanguage, sourceLanguage, sourceText, targetLanguage]);

  const lexicalAnalysis = useMemo(() => {
    const textToAnalyze = translatedText.trim() || sourceText.trim();
    const clean = textToAnalyze
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim();

    if (!clean) {
      return {
        keyWord: "En attente de sélection...",
        totalWords: 0,
        totalCharactersWithSpaces: 0,
        totalCharactersWithoutSpaces: 0,
      };
    }

    const words = clean.split(/\s+/).filter(Boolean);
    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }

    const keyWord = [...frequency.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      keyWord: keyWord ?? words[0],
      totalWords: words.length,
      totalCharactersWithSpaces: textToAnalyze.length,
      totalCharactersWithoutSpaces: textToAnalyze.replace(/\s/g, "").length,
    };
  }, [sourceText, translatedText]);

  const handleGenerateLexicalAnalysis = async () => {
    if (!translatedText.trim()) {
      setAiLexicalAnalysis(
        "Traduisez d'abord un texte pour lancer l'analyse IA."
      );
      return;
    }

    setIsGeneratingLexicalAnalysis(true);

    try {
      const response = await fetch("/api/translation/lexical-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translatedText }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const payload = (await response.json()) as { analysis?: string };
      setAiLexicalAnalysis(payload.analysis ?? "Analyse indisponible.");
    } catch {
      setAiLexicalAnalysis(
        "Impossible de générer l'analyse IA pour le moment."
      );
    } finally {
      setIsGeneratingLexicalAnalysis(false);
    }
  };

  const synonyms = useMemo(() => {
    const list = synonymsMap[lexicalAnalysis.keyWord] ?? [];
    return list.length > 0 ? list : ["Aucun synonyme suggéré pour ce terme."];
  }, [lexicalAnalysis.keyWord]);

  const swapLanguages = () => {
    if (sourceLanguage === "auto") {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(detectedLanguage === "auto" ? "fr" : detectedLanguage);
      return;
    }

    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="liquid-glass flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Languages className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Traduction</h1>
            <p className="text-xs text-muted-foreground">
              Détection auto:{" "}
              {sourceLanguage === "auto" ? detectedLanguage : sourceLanguage}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          <SendHorizonal className="mr-2 size-4" /> Exporter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="liquid-glass flex flex-col space-y-3 rounded-xl border border-border p-4">
          <div className="border-b border-border pb-3">
            <select
              className="h-8 rounded-full border border-border/40 bg-background/50 px-3 text-xs text-muted-foreground"
              onChange={(e) => setSourceLanguage(e.target.value)}
              value={sourceLanguage}
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="h-48 resize-none bg-transparent p-2 text-base outline-none md:h-64"
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Saisissez le texte à traduire..."
            value={sourceText}
          />
        </div>

        <div className="flex items-center justify-center">
          <Button
            className="rounded-full"
            onClick={swapLanguages}
            type="button"
            variant="secondary"
          >
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>

        <div className="liquid-glass flex flex-col space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="border-b border-border pb-3">
            <select
              className="h-8 rounded-full border border-border/40 bg-background/50 px-3 text-xs text-muted-foreground"
              onChange={(e) => setTargetLanguage(e.target.value)}
              value={targetLanguage}
            >
              {languageOptions
                .filter((lang) => lang.code !== "auto")
                .map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
            </select>
          </div>
          <div className="h-48 overflow-y-auto p-2 text-base md:h-64">
            {isTranslating ? (
              <span className="text-muted-foreground italic">
                Traduction en cours...
              </span>
            ) : translatedText ? (
              translatedText
            ) : (
              <span className="text-muted-foreground italic">
                La traduction s'affichera ici...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="liquid-glass rounded-xl border border-border p-5">
          <div className="mb-3 flex items-center space-x-2">
            <BookOpen className="size-5 text-primary/70" />
            <h3 className="text-lg font-semibold">Analyse Lexicale</h3>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p>Mot-clé détecté : {lexicalAnalysis.keyWord}</p>
            <p>Total mots : {lexicalAnalysis.totalWords}</p>
            <p>
              Caractères (espaces inclus) :{" "}
              {lexicalAnalysis.totalCharactersWithSpaces}
            </p>
            <p>
              Caractères (sans espaces) :{" "}
              {lexicalAnalysis.totalCharactersWithoutSpaces}
            </p>
            <div className="mt-3 rounded-lg border border-border/60 bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-foreground">
                  Analyse IA (GPT-5.4 Nano)
                </p>
                <Button
                  className="h-7 rounded-full px-3 text-xs"
                  disabled={
                    isGeneratingLexicalAnalysis || !translatedText.trim()
                  }
                  onClick={handleGenerateLexicalAnalysis}
                  type="button"
                  variant="outline"
                >
                  {isGeneratingLexicalAnalysis ? "Génération..." : "Générer"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {aiLexicalAnalysis ||
                  "Cliquez sur Générer pour une analyse courte."}
              </p>
            </div>
          </div>
        </div>

        <div className="liquid-glass rounded-xl border border-border p-5">
          <div className="mb-3 flex items-center space-x-2">
            <RefreshCcw className="size-5 text-primary/70" />
            <h3 className="text-lg font-semibold">Synonymes & Alternatives</h3>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
            <ul className="list-disc pl-5">
              {synonyms.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
