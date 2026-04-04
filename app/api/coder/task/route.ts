import { NextResponse } from "next/server";

type FileEntry = { content: string; path: string };

type TaskMode = "Planification" | "Investigation" | "Exécution";

export async function POST(request: Request) {
  try {
    const { files, mode, modelId, prompt } = (await request.json()) as {
      files?: FileEntry[];
      mode?: TaskMode;
      modelId?: string;
      prompt?: string;
    };

    if (!prompt?.trim() || !mode) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const safeFiles = files ?? [];
    const history: string[] = [];
    const commands: string[] = [];
    let updatedFiles = [...safeFiles];

    history.push(
      `[Réflexion] Mode ${mode} avec modèle ${modelId ?? "défaut"}.`
    );
    history.push(`[Objectif] ${prompt}`);

    if (mode === "Planification") {
      return NextResponse.json({
        commands: ["analyse:scope", "analyse:impact", "plan:validation"],
        history: [
          ...history,
          "[Plan] 1) Identifier les fichiers à modifier.",
          "[Plan] 2) Préparer patchs et tests.",
          "[Plan] 3) Valider avant exécution.",
        ],
        updatedFiles,
      });
    }

    if (mode === "Investigation") {
      commands.push("npm run lint", "npm run security:scan");

      updatedFiles = safeFiles.map((file) => {
        let content = file.content;
        let touched = false;

        // Correctifs sûrs centrés bug/sécurité, sans changer d'autres domaines.
        if (content.includes("console.log(")) {
          content = content.replaceAll("console.log(", "// console.log(");
          touched = true;
          history.push(`[Fix] Logs de debug neutralisés dans ${file.path}.`);
        }

        if (content.includes("TODO")) {
          history.push(`[Alerte] TODO détecté dans ${file.path}.`);
        }

        if (content.includes("dangerouslySetInnerHTML")) {
          history.push(
            `[Sécurité] Vérifier l'assainissement dans ${file.path}.`
          );
        }

        if (content.includes(": any")) {
          content = content.replaceAll(": any", ": unknown");
          touched = true;
          history.push(
            `[Fix] Typage renforcé (: any -> : unknown) dans ${file.path}.`
          );
        }

        return touched ? { ...file, content } : file;
      });

      if (history.length <= 2) {
        history.push("[Analyse] Aucune faille automatique détectée.");
      }
    }

    if (mode === "Exécution") {
      commands.push("npm run build", "npm run test");

      if (safeFiles.length === 0) {
        updatedFiles = [
          {
            path: "src/generated/task-note.md",
            content: `# Tâche\n\n${prompt}\n\n- Généré automatiquement en mode Exécution.`,
          },
        ];
        history.push("[Fichier] Création de src/generated/task-note.md");
      } else {
        updatedFiles = safeFiles.map((file, index) => {
          if (index !== 0) {
            return file;
          }
          return {
            ...file,
            content: `${file.content}\n\n/* Mode Exécution: mise à jour automatique */\n`,
          };
        });
        history.push(
          `[Fichier] Mise à jour automatique: ${safeFiles[0]?.path}`
        );
      }
    }

    history.push("[Terminal] Exécution terminée.");

    return NextResponse.json({ commands, history, updatedFiles });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur coder" },
      { status: 500 }
    );
  }
}
