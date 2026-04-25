"use client";

import { AlertTriangle, Archive, Copy, EllipsisVertical, Lock, Pin, Search, Upload } from "lucide-react";
import { Streamdown } from "streamdown";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatModels } from "@/lib/ai/models";

type HealthMessage = { content: string; role: "assistant" | "user" };

type HealthConversation = {
  archived?: boolean;
  createdAt: string;
  id: string;
  locked?: boolean;
  messages: HealthMessage[];
  pinHash?: string;
  pinned?: boolean;
  title: string;
};

const HISTORY_KEY = "mai.health.history.v2";
const DEFAULT_HEALTH_MODEL_KEY = "mai.settings.default.health-model.v1";

function hashPin(pin: string) {
  let hash = 0;
  for (let i = 0; i < pin.length; i += 1) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function loadHistory(): HealthConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HealthConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HealthPage() {
  const [message, setMessage] = useState("");
  const [modelId, setModelId] = useState(() =>
    typeof window === "undefined"
      ? "gpt-5.4-mini"
      : window.localStorage.getItem(DEFAULT_HEALTH_MODEL_KEY) ?? "gpt-5.4-mini"
  );
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HealthConversation[]>(() => loadHistory());
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedConversation = history.find((item) => item.id === selectedId) ?? null;

  const persistHistory = (next: HealthConversation[]) => {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = history
      .filter((item) => !item.archived)
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
    if (!query) return base;
    return base.filter((item) => `${item.title} ${item.messages.map((m) => m.content).join(" ")}`.toLowerCase().includes(query));
  }, [history, search]);

  const upsertConversation = (conversation: HealthConversation) => {
    const next = [conversation, ...history.filter((entry) => entry.id !== conversation.id)].slice(0, 40);
    persistHistory(next);
    setSelectedId(conversation.id);
  };

  const analyze = async () => {
    if (!message.trim()) return;

    setLoading(true);
    const userMessage: HealthMessage = { content: message, role: "user" };

    try {
      const response = await fetch("/api/health/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: selectedConversation
            ? [...selectedConversation.messages.map((m) => `${m.role}: ${m.content}`), `user: ${message}`].join("\n")
            : message,
          modelId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) return;

      const assistantMessage: HealthMessage = {
        content: payload.analysis ?? "",
        role: "assistant",
      };

      const nextConversation: HealthConversation = selectedConversation
        ? {
            ...selectedConversation,
            messages: [...selectedConversation.messages, userMessage, assistantMessage],
            title: selectedConversation.title,
          }
        : {
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            messages: [userMessage, assistantMessage],
            title: message.slice(0, 64),
          };

      upsertConversation(nextConversation);
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const ensureUnlocked = (conversation: HealthConversation) => {
    if (!conversation.locked || !conversation.pinHash) return true;
    const pin = window.prompt("Conversation verrouillée. Entrez le code PIN à 4 chiffres :")?.trim() ?? "";
    if (hashPin(pin) !== conversation.pinHash) {
      window.alert("PIN incorrect.");
      return false;
    }
    return true;
  };

  const toggleLockConversation = (conversation: HealthConversation) => {
    if (!conversation.locked) {
      const pin = window.prompt("Définissez un code PIN à 4 chiffres :")?.trim() ?? "";
      const confirm = window.prompt("Confirmez le code PIN :")?.trim() ?? "";
      if (!/^\d{4}$/.test(pin) || pin !== confirm) {
        window.alert("PIN invalide ou confirmation incorrecte.");
        return;
      }
      persistHistory(history.map((item) => (item.id === conversation.id ? { ...item, locked: true, pinHash: hashPin(pin) } : item)));
      return;
    }

    const oldPin = window.prompt("Ancien code PIN :")?.trim() ?? "";
    if (hashPin(oldPin) !== conversation.pinHash) {
      window.alert("Ancien code incorrect.");
      return;
    }
    const nextPin = window.prompt("Nouveau code PIN (4 chiffres):")?.trim() ?? "";
    const confirmNext = window.prompt("Confirmez le nouveau code PIN :")?.trim() ?? "";
    if (!/^\d{4}$/.test(nextPin) || nextPin !== confirmNext) {
      window.alert("Nouveau PIN invalide ou confirmation incorrecte.");
      return;
    }
    persistHistory(history.map((item) => (item.id === conversation.id ? { ...item, pinHash: hashPin(nextPin), locked: true } : item)));
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    setMessage((current) => (current ? `${current}\n\n${text.slice(0, 12000)}` : text.slice(0, 12000)));
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl gap-4 overflow-y-auto p-4 md:p-8">
      <aside className="liquid-glass w-full max-w-sm rounded-2xl p-4">
        <h2 className="text-lg font-semibold">Historique Health</h2>
        <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-border/60 px-2">
          <Search className="size-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une discussion..." value={search} />
        </label>
        <div className="mt-3 space-y-2">
          {filteredHistory.map((item) => (
            <div className="rounded-lg border border-border/60 p-2" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <button className="flex-1 text-left text-xs" onClick={() => { if (ensureUnlocked(item)) setSelectedId(item.id); }} type="button">
                  <p className="font-semibold">{item.pinned ? "📌 " : ""}{item.title}</p>
                  <p className="text-muted-foreground">{new Date(item.createdAt).toLocaleString("fr-FR")}</p>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded p-1 hover:bg-muted" type="button"><EllipsisVertical className="size-4" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => toggleLockConversation(item)}><Lock className="mr-2 size-4" /> {item.locked ? "Modifier PIN" : "Verrouiller"}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(item.messages.map((m) => `${m.role}: ${m.content}`).join("\n\n"))}><Copy className="mr-2 size-4" /> Copier</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { const blob = new Blob([item.messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")], { type: "text/plain" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${item.title}.txt`; a.click(); URL.revokeObjectURL(url); }}><Upload className="mr-2 size-4" /> Exporter</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => persistHistory(history.map((entry) => entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry))}><Pin className="mr-2 size-4" /> {item.pinned ? "Désépingler" : "Épingler"}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => persistHistory(history.map((entry) => entry.id === item.id ? { ...entry, archived: true } : entry))}><Archive className="mr-2 size-4" /> Archiver</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="liquid-glass flex-1 rounded-2xl p-4">
        <h1 className="text-3xl font-bold">Health</h1>
        <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Avertissement médical</p>
          <p>Cette IA ne remplace pas un professionnel de santé.</p>
        </div>

        <label className="mt-4 block text-sm">Modèle IA
          <select className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setModelId(event.target.value)} value={modelId}>
            {chatModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
          </select>
        </label>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
          <Upload className="size-4" /> Importer un fichier
          <input className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) importFile(file); }} type="file" />
        </label>

        <textarea className="mt-3 h-36 w-full rounded-xl border border-border/60 bg-background/60 p-3 text-sm" onChange={(event) => setMessage(event.target.value)} placeholder="Posez votre question santé, ou importez un document..." value={message} />
        <Button className="mt-3" onClick={analyze} type="button">{loading ? "Analyse..." : "Envoyer"}</Button>

        <article className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert" style={{ fontFamily: "Atkinson Hyperlegible, Inter, system-ui, sans-serif" }}>
            {selectedConversation ? (
              selectedConversation.messages.map((entry, index) => (
                <div className="mb-4" key={`${selectedConversation.id}-${index}`}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{entry.role === "assistant" ? "IA" : "Vous"}</p>
                  <Streamdown>{entry.content}</Streamdown>
                </div>
              ))
            ) : (
              "Sélectionnez un échange dans l'historique."
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
