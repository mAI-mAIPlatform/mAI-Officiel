"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AgentForm({
  open,
  onOpenChange,
  agent,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: any;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      systemPrompt: formData.get("systemPrompt"),
      memory: formData.get("memory"),
      image: formData.get("image"),
    };

    try {
      const url = agent ? `/api/agents/${agent.id}` : "/api/agents";
      const method = agent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save agent");
      }

      toast.success(agent ? "mAI mis à jour" : "mAI créé avec succès");
      onSuccess();
    } catch (_err) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent ? "Modifier le mAI" : "Créer un nouveau mAI"}
          </DialogTitle>
        </DialogHeader>

        <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              defaultValue={agent?.name}
              id="name"
              name="name"
              placeholder="ex: Assistant Juridique"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              defaultValue={agent?.description}
              id="description"
              name="description"
              placeholder="Brève description de ce mAI..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Logo (URL)</Label>
            <Input
              defaultValue={agent?.image}
              id="image"
              name="image"
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">
              Comportement & Instructions (System Prompt)
            </Label>
            <Textarea
              className="min-h-[100px]"
              defaultValue={agent?.systemPrompt}
              id="systemPrompt"
              name="systemPrompt"
              placeholder="Tu es un expert en droit des affaires..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="memory">Base de connaissances (Texte)</Label>
            <Textarea
              className="min-h-[100px]"
              defaultValue={agent?.memory}
              id="memory"
              name="memory"
              placeholder="Collez ici les textes de référence, lois, documents internes..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={loading} type="submit">
              {loading
                ? "Enregistrement..."
                : agent
                  ? "Mettre à jour"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
