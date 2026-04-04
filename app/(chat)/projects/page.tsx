import { BotIcon, BrainIcon, LinkIcon, PuzzleIcon } from "lucide-react";

const projectModules = [
  {
    title: "Module mAIs",
    description:
      "Créez des agents IA personnalisés avec connaissances documentaires, directives opérationnelles et branding.",
    points: [
      "Base de connaissances documentaire (import, indexation, filtres)",
      "Directives de comportement et style de réponse",
      "Partage via lien sécurisé et invocation @nom dans la barre de conversation",
    ],
    icon: BotIcon,
  },
  {
    title: "Analyse cognitive",
    description:
      "Activez des modes avancés pour guider la réflexion de l'utilisateur et enrichir les réponses.",
    points: [
      "Inférence réflexive",
      "Indexation web en temps réel",
      "Mode pédagogique orienté maïeutique",
    ],
    icon: BrainIcon,
  },
  {
    title: "Évaluation",
    description:
      "Générez des supports d'apprentissage et de validation des acquis en un clic.",
    points: ["Canevas structuré", "Quiz personnalisés", "Suivi des résultats"],
    icon: PuzzleIcon,
  },
];

export default function ProjectsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <section className="liquid-glass rounded-3xl p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Projets (Bêta)
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Version 0.0.8</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Cette page centralise les initiatives mAIs, l&apos;analyse cognitive
          et les outils d&apos;évaluation. Les projets sont désormais séparés
          des paramètres pour une gestion plus lisible.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {projectModules.map((module) => {
          const Icon = module.icon;
          return (
            <article
              className="liquid-glass rounded-2xl border border-border/30 p-4"
              key={module.title}
            >
              <div className="mb-3 inline-flex rounded-xl border border-border/40 p-2">
                <Icon className="size-4" />
              </div>
              <h2 className="text-sm font-semibold">{module.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {module.description}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {module.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="liquid-glass rounded-2xl p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <LinkIcon className="size-3.5" /> Partage mAIs
        </p>
        <p className="mt-1">
          Les mAIs partagés peuvent être invoqués depuis la barre de saisie via
          la syntaxe <span className="font-mono">@nom-agent</span>.
        </p>
      </section>
    </main>
  );
}
