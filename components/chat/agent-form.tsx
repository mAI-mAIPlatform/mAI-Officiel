"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AgentForm({
  open,
  onOpenChange,
  agent,
  onSuccess
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

      if (!res.ok) throw new Error("Failed to save agent");

      toast.success(agent ? "mAI mis à jour" : "mAI créé avec succès");
      onSuccess();
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? "Modifier le mAI" : "Créer un nouveau mAI"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={agent?.name} required placeholder="ex: Assistant Juridique" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={agent?.description} placeholder="Brève description de ce mAI..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Logo (URL)</Label>
            <Input id="image" name="image" defaultValue={agent?.image} placeholder="https://..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">Comportement & Instructions (System Prompt)</Label>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              defaultValue={agent?.systemPrompt}
              className="min-h-[100px]"
              placeholder="Tu es un expert en droit des affaires..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="memory">Base de connaissances (Texte)</Label>
            <Textarea
              id="memory"
              name="memory"
              defaultValue={agent?.memory}
              className="min-h-[100px]"
              placeholder="Collez ici les textes de référence, lois, documents internes..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : (agent ? "Mettre à jour" : "Créer")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
