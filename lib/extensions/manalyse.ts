export type AnalyseSentiment = "positif" | "négatif" | "neutre";

export type AnalyseReport = {
  summary: string;
  keyPoints: string[];
  sentiment: {
    label: AnalyseSentiment;
    confidence: number;
    rationale: string;
  };
  conclusion: string;
  rawTextLength: number;
};

const positiveWords = [
  "croissance",
  "succès",
  "fiable",
  "opportunité",
  "amélioration",
  "excellent",
  "gagner",
  "innovation",
  "stable",
];

const negativeWords = [
  "risque",
  "problème",
  "échec",
  "retard",
  "perte",
  "difficile",
  "critique",
  "instable",
  "bug",
];

const sanitizeText = (input: string) => input.replace(/\s+/g, " ").trim();

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 20);

const computeSentiment = (text: string) => {
  const normalized = text.toLowerCase();
  const positiveCount = positiveWords.reduce(
    (score, keyword) => score + Number(normalized.includes(keyword)),
    0
  );
  const negativeCount = negativeWords.reduce(
    (score, keyword) => score + Number(normalized.includes(keyword)),
    0
  );

  if (positiveCount === negativeCount) {
    return {
      label: "neutre" as const,
      confidence: 0.51,
      rationale:
        "Le contenu contient autant d'indices positifs que négatifs, avec une tonalité globalement descriptive.",
    };
  }

  const dominant = Math.max(positiveCount, negativeCount);
  const total = Math.max(positiveCount + negativeCount, 1);

  return {
    label:
      positiveCount > negativeCount
        ? ("positif" as const)
        : ("négatif" as const),
    confidence: Number((0.55 + dominant / (total * 3)).toFixed(2)),
    rationale:
      positiveCount > negativeCount
        ? "Les formulations mettent en avant des bénéfices, des progrès ou des résultats favorables."
        : "Le texte insiste surtout sur des risques, des difficultés ou des contraintes à surveiller.",
  };
};

export const createStructuredReport = (text: string): AnalyseReport => {
  const cleaned = sanitizeText(text);
  const sentences = splitSentences(cleaned);

  const summary =
    sentences.slice(0, 2).join(" ") ||
    "Le contenu analysé est trop court pour produire un résumé détaillé.";

  const keyPoints = sentences
    .slice(0, 5)
    .map((sentence, index) => `${index + 1}. ${sentence}`) || [
    "Aucun point clé n'a pu être isolé.",
  ];

  const sentiment = computeSentiment(cleaned);

  return {
    summary,
    keyPoints,
    sentiment,
    conclusion:
      "La matière extraite est structurée et peut être exploitée pour une prise de décision rapide, avec validation humaine recommandée.",
    rawTextLength: cleaned.length,
  };
};

export const extractReadableTextFromHtml = (html: string) => {
  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");

  return withoutScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
