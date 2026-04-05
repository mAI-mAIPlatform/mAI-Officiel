import {
  BadgeCheck,
  CalendarClock,
  Cpu,
  FileText,
  Sparkles,
} from "lucide-react";

const changelog = [
  {
    version: "0.1.8",
    date: "2026-04-05",
    items: [
      "Régulation des ressources mAINews par quota journalier selon le forfait.",
      "Régulation des ressources mAIHealth par quota mensuel selon le forfait.",
      "Affichage des compteurs de consommation directement dans chaque module.",
    ],
  },
  {
    version: "0.1.7",
    date: "2026-04-05",
    items: [
      "Ajout du programmateur de prompts automatiques dans Paramètres > Tâches.",
      "Planification récurrente avec fréquence, date du prochain lancement, titre et modèle IA.",
      "Mise en place des quotas de tâches: Free (2), Plus (5), Pro (10), Max (20).",
    ],
  },
  {
    version: "0.1.4",
    date: "2026-04-05",
    items: [
      "Ajout du module de Santé Numérique mAIHealth avec zone d'analyse de documents.",
      "Clause obligatoire de non-responsabilité médicale intégrée à l'expérience IA.",
      "Renforcement des mécanismes de signalement pour les contenus violence/abus.",
      "Amélioration linguistique: l'IA répond désormais dans la langue du dernier message utilisateur.",
    ],
  },
  {
    version: "0.1.2",
    date: "2026-04-04",
    items: [
      "Ajout de Coder, Actualités (mAINews), Traduction et Paramètres.",
      "Historique conversations : renommer, épingler, signaler, exporter.",
      "Accès restreint pour Coder et Actualités.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-03-20",
    items: [
      "Amélioration de la traduction multilingue.",
      "Analyse lexicale et suggestions contextuelles.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-5xl flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="rounded-2xl border border-border/50 bg-card/70 p-5">
        <div className="flex items-center gap-3">
          <BadgeCheck className="size-7 text-primary" />
          <h1 className="text-3xl font-bold">À propos de mAI</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Plateforme IA orientée productivité, conversation et automatisation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
          <p className="mb-2 flex items-center gap-2 font-semibold">
            <Cpu className="size-4" /> Stack technique
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Next.js App Router</li>
            <li>Vercel AI SDK</li>
            <li>Drizzle ORM + Postgres</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
          <p className="mb-2 flex items-center gap-2 font-semibold">
            <Sparkles className="size-4" /> Nouveautés
          </p>
          <p className="text-sm text-muted-foreground">
            Automatisation récurrente des tâches, quotas intelligents mAINews /
            mAIHealth, sécurité renforcée et expérience Liquid Glass homogène.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
        <p className="mb-3 flex items-center gap-2 font-semibold">
          <CalendarClock className="size-4" /> Changelog
        </p>
        <div className="space-y-3">
          {changelog.map((entry) => (
            <div
              className="rounded-xl border border-border/40 bg-background/60 p-3"
              key={entry.version}
            >
              <p className="font-medium">
                v{entry.version} • {entry.date}
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <FileText className="size-4" /> Version active: 0.1.8
        </p>
      </section>
    </div>
  );
}
