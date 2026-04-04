"use client";

import { BotIcon, PenSquareIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentForm } from "./agent-form";

export function AgentListDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: agents, mutate } = useSWR("/api/agents", (url) =>
    fetch(url).then((res) => res.json())
  );
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      mutate();
      toast.success("mAI supprimé");
    } catch (_e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mes mAIs</DialogTitle>
            <DialogDescription>
              Gérez vos modèles d'IA personnalisés.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <Button
              className="w-full flex items-center gap-2"
              onClick={() => {
                setEditingAgent(null);
                setIsFormOpen(true);
                onOpenChange(false);
              }}
            >
              <PlusIcon size={16} />
              Créer un nouveau mAI
            </Button>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {agents && agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Vous n'avez pas encore créé de mAI.
                </p>
              )}
              {agents?.map((agent: any) => (
                <div
                  className="flex items-center justify-between p-3 border rounded-lg"
                  key={agent.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md text-primary">
                      {agent.image ? (
                        <img
                          alt={agent.name}
                          className="w-5 h-5 rounded-sm object-cover"
                          src={agent.image}
                        />
                      ) : (
                        <BotIcon size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{agent.name}</h4>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => {
                        setEditingAgent(agent);
                        setIsFormOpen(true);
                        onOpenChange(false);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <PenSquareIcon size={14} />
                    </Button>
                    <Button
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(agent.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AgentForm
        agent={editingAgent}
        onOpenChange={(v) => {
          setIsFormOpen(v);
          if (!v) {
            onOpenChange(true); // Reopen list when form closes
          }
        }}
        onSuccess={() => {
          mutate();
          setIsFormOpen(false);
          onOpenChange(true);
        }}
        open={isFormOpen}
      />
    </>
  );
}
