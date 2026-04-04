"use client";

import {
  FolderKanbanIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProjectsPage() {
  const { data: projects, error, mutate } = useSWR("/api/projects", fetcher);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [memory, setMemory] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          memory,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de création");
      }

      toast.success("Projet créé avec succès");
      setIsOpen(false);
      setName("");
      setDescription("");
      setInstructions("");
      setMemory("");
      mutate(); // refresh data
    } catch (_err) {
      toast.error("Impossible de créer le projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-8 md:p-12 overflow-y-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanbanIcon className="size-8 text-primary" />
            Mes Projets
          </h1>
          <p className="text-muted-foreground mt-2">
            Espace de travail organisé autour d'objectifs (mémoire intégrée,
            contextes, documents).
          </p>
        </div>

        <Dialog onOpenChange={setIsOpen} open={isOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              Créer un Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau Projet</DialogTitle>
            </DialogHeader>
            <form className="space-y-6 mt-4" onSubmit={handleCreateProject}>
              <div className="space-y-2">
                <Label htmlFor="name">Titre du Projet</Label>
                <Input
                  id="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Refonte Site Web"
                  required
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bref résumé de l'objectif..."
                  rows={2}
                  value={description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">
                  Instructions de l'IA (Contexte Global)
                </Label>
                <Textarea
                  id="instructions"
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions spécifiques appliquées à tous les agents dans ce projet..."
                  rows={3}
                  value={instructions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory">Connaissances / Sources (Texte)</Label>
                <Textarea
                  id="memory"
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="Collez ici du texte, de la doc ou des informations clés..."
                  rows={4}
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

      {error ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          Erreur lors du chargement des projets.
        </div>
      ) : projects ? (
        projects.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <FolderKanbanIcon className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Aucun projet</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Vous n'avez pas encore créé de projet.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              Créer mon premier Projet
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <div
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
                key={project.id}
              >
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {project.image ? (
                      <img
                        alt=""
                        className="h-8 w-8 rounded-md object-cover"
                        src={project.image}
                      />
                    ) : (
                      <FolderKanbanIcon className="size-6" />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold tracking-tight">
                    {project.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.description || "Aucune description."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">
                    Créé le {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    className="size-8"
                    size="icon"
                    title="Paramètres (Bientôt)"
                    variant="ghost"
                  >
                    <SettingsIcon className="size-4" />
                  </Button>
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
