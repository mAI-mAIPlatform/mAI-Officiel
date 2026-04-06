"use client";

import { BrainCircuit, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

function buildSocraticQuestions(topic: string) {
  const seed = topic.trim() || "ton idée";
  return [
    `Quel problème concret ${seed} résout-il vraiment ?`,
    "Quels utilisateurs prioritaires seraient impactés en premier ?",
    "Quel indicateur mesurable prouverait la réussite en 30 jours ?",
  ];
}

function buildPlan(topic: string) {
  const seed = topic.trim() || "Idée principale";
  return [
    `Vision: définir la promesse centrale de « ${seed} ».`,
    "Hypothèses: lister les hypothèses critiques et leurs risques.",
    "Expérimentation: lancer un test rapide avec feedback utilisateur.",
    "Itération: améliorer le concept selon les données collectées.",
  ];
}

export default function BrainstormingPage() {
  const [idea, setIdea] = useState("");

  const questions = useMemo(() => buildSocraticQuestions(idea), [idea]);
  const plan = useMemo(() => buildPlan(idea), [idea]);

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BrainCircuit className="size-6 text-primary" /> Brainstorming
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mode Socrate activé: l&apos;IA pose des questions de relance pour
          approfondir votre idée avant de proposer un plan clair.
        </p>
      </header>

      <section className="liquid-glass rounded-2xl p-5">
        <label className="text-sm">
          Votre idée de départ
          <textarea
            className="mt-1 min-h-28 w-full rounded-xl border border-border/60 bg-background/60 p-3"
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Ex: Lancer un service IA pour aider les artisans à gérer les devis."
            value={idea}
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="liquid-glass rounded-2xl p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <ListChecks className="size-4 text-primary" /> Questions de relance
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </article>

        <article className="liquid-glass rounded-2xl p-5">
          <h2 className="mb-2 font-semibold">Plan de visualisation</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {plan.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  );
}
