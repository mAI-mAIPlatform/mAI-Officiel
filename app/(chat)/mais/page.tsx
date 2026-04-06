"use client";

import {
  BotIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chatModels } from "@/lib/ai/models";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const expertPresets = [
  "Enseignant",
  "Développeur",
  "Écrivain",
  "Coach",
  "Juridique",
  "Chef",
  "Voyageur",
  "Designer",
  "Analyste",
  "Santé",
  "Cyber",
  "Cinéphile",
  "Musicien",
  "Stratège",
] as const;

export default function MaisPage() {
  const { data: agents, error, mutate } = useSWR("/api/agents", fetcher);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [memory, setMemory] = useState("");
  const [baseModel, setBaseModel] = useState(chatModels[0]?.id ?? "");

  // Agent Behavior Configuration
  const [tone, setTone] = useState("50");
  const [conciseness, setConciseness] = useState("50");
  const [languageRegister, setLanguageRegister] = useState("50");

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          memory,
          baseModel,
          tone: Number.parseInt(tone, 10),
          conciseness: Number.parseInt(conciseness, 10),
          languageRegister: Number.parseInt(languageRegister, 10),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de création");
      }

      toast.success("mAI créé avec succès");
      setIsOpen(false);
      // Reset form
      setName("");
      setDescription("");
      setSystemPrompt("");
      setMemory("");
      setBaseModel(chatModels[0]?.id ?? "");
      setTone("50");
      setConciseness("50");
      setLanguageRegister("50");
      mutate();
    } catch (_err) {
      toast.error("Impossible de créer le mAI");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast("Confirmer la suppression de ce mAI ?", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          try {
            const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
            if (!res.ok) {
              throw new Error("Erreur");
            }
            toast.success("mAI supprimé");
            mutate();
          } catch (_err) {
            toast.error("Impossible de supprimer le mAI");
          }
        },
      },
    });
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col overflow-y-auto p-8 md:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl border border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
              <BotIcon className="size-5" />
            </span>
            Mes mAIs
          </h1>
          <p className="text-muted-foreground mt-2">
            IAs personnalisées avec rôles, personnalités et connaissances
            spécifiques.
          </p>
        </div>

        <Dialog onOpenChange={setIsOpen} open={isOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              Créer un mAI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle IA (mAI)</DialogTitle>
            </DialogHeader>
            <form className="space-y-6 mt-4" onSubmit={handleCreateAgent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du mAI</Label>
                    <Input
                      id="name"
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: mAI Dev Next.js"
                      required
                      value={name}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Spécialiste en React et Tailwind..."
                      value={description}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseModel">Modèle de base</Label>
                    <select
                      className="liquid-glass flex h-10 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      id="baseModel"
                      onChange={(e) => setBaseModel(e.target.value)}
                      value={baseModel}
                    >
                      {chatModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6 rounded-lg border p-4 bg-muted/30">
                  <h4 className="font-semibold flex items-center gap-2 text-sm">
                    <SlidersHorizontalIcon className="size-4" />{" "}
                    Personnalisation du Comportement
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Créatif / Libre</span>
                      <span>Ton ({tone}%)</span>
                      <span>Strict / Pro</span>
                    </div>
                    <input
                      className="w-full accent-primary"
                      max="100"
                      min="0"
                      onChange={(e) => setTone(e.target.value)}
                      type="range"
                      value={tone}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Très détaillé</span>
                      <span>Concision ({conciseness}%)</span>
                      <span>Ultra concis</span>
                    </div>
                    <input
                      className="w-full accent-primary"
                      max="100"
                      min="0"
                      onChange={(e) => setConciseness(e.target.value)}
                      type="range"
                      value={conciseness}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Familier</span>
                      <span>Registre Linguistique ({languageRegister}%)</span>
                      <span>Soutenu</span>
                    </div>
                    <input
                      className="w-full accent-primary"
                      max="100"
                      min="0"
                      onChange={(e) => setLanguageRegister(e.target.value)}
                      type="range"
                      value={languageRegister}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">
                  Instructions (System Prompt)
                </Label>
                <Textarea
                  id="systemPrompt"
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Tu es un expert en développement web. Tes réponses doivent toujours inclure des exemples de code..."
                  rows={4}
                  value={systemPrompt}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory">
                  Connaissances / Sources supplémentaires
                </Label>
                <Textarea
                  id="memory"
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="Texte de référence, documentation à utiliser en priorité..."
                  rows={3}
                  value={memory}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting && (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  )}
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <section className="mb-6 rounded-2xl border border-border/50 bg-card/65 p-4">
        <h2 className="mb-3 text-sm font-semibold">
          mAIs Presets (14 experts)
        </h2>
        <div className="flex flex-wrap gap-2">
          {expertPresets.map((preset) => (
            <button
              className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
              key={preset}
              onClick={() => {
                setIsOpen(true);
                setName(`mAI ${preset}`);
                setDescription(`Assistant expert : ${preset}.`);
                setSystemPrompt(
                  `Tu es un expert ${preset}. Réponds avec précision, pédagogie et structure.`
                );
              }}
              type="button"
            >
              {preset}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          Erreur lors du chargement des mAIs.
        </div>
      ) : agents ? (
        agents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <BotIcon className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Aucun mAI</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Créez votre première intelligence artificielle spécialisée.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              Créer mon premier mAI
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: any) => (
              <div
                className="liquid-glass group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card/70 p-6 shadow-sm transition-all hover:shadow-md"
                key={agent.id}
              >
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-black/20 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                    {agent.image ? (
                      <div
                        className="h-8 w-8 rounded-md bg-cover bg-center"
                        style={{ backgroundImage: `url(${agent.image})` }}
                      />
                    ) : (
                      <BotIcon className="size-6" />
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold tracking-tight">
                    {agent.name}
                  </h3>
                  <p className="mb-2 text-xs font-medium text-primary/80">
                    {agent.baseModel}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {agent.description || "Aucune description."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">
                    Créé le {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      className="size-8"
                      size="icon"
                      title="Paramètres (Bientôt)"
                      variant="ghost"
                    >
                      <SettingsIcon className="size-4" />
                    </Button>
                    <Button
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(agent.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
