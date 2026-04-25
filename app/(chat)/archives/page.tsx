"use client";

import { ArchiveRestore, Pin, PinOff, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Chat } from "@/lib/db/schema";

type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 50;

export default function ArchivesPage() {
  const [archivedChatIds, setArchivedChatIds] = useLocalStorage<string[]>(
    "mai.archived.chats",
    []
  );
  const [pinnedChatIds, setPinnedChatIds] = useLocalStorage<string[]>(
    "mai.pinned.chats",
    []
  );
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const loadChats = async () => {
      setIsLoading(true);
      try {
        const fetched: Chat[] = [];
        let hasMore = true;
        let endingBefore: string | null = null;
        let guard = 0;

        while (hasMore && guard < 10) {
          const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
          if (endingBefore) {
            params.set("ending_before", endingBefore);
          }

          const response = await fetch(`/api/history?${params.toString()}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            break;
          }

          const payload = (await response.json()) as ChatHistory;
          fetched.push(...payload.chats);
          hasMore = payload.hasMore;
          endingBefore = payload.chats.at(-1)?.id ?? null;
          guard += 1;
        }

        if (active) {
          setAllChats(fetched);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadChats();
    return () => {
      active = false;
    };
  }, []);

  const archivedChats = useMemo(() => {
    const ids = new Set(archivedChatIds);
    const query = search.trim().toLowerCase();

    return allChats
      .filter((chat) => ids.has(chat.id))
      .filter((chat) => {
        if (!query) {
          return true;
        }
        return `${chat.title} ${chat.id}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aPinned = pinnedChatIds.includes(a.id);
        const bPinned = pinnedChatIds.includes(b.id);
        if (aPinned !== bPinned) {
          return aPinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [allChats, archivedChatIds, pinnedChatIds, search]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Archives</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez vos discussions archivées, recherchez-les, épinglez-les ou restaurez-les.
        </p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher dans les archives"
            value={search}
          />
        </div>
      </section>

      <section className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des archives...</p>
        ) : archivedChats.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
            Aucune discussion archivée trouvée.
          </p>
        ) : (
          archivedChats.map((chat) => {
            const isPinned = pinnedChatIds.includes(chat.id);
            return (
              <article
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-3"
                key={chat.id}
              >
                <div className="min-w-0">
                  <Link className="truncate font-medium hover:underline" href={`/chat/${chat.id}`}>
                    {chat.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(chat.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      setPinnedChatIds((current) =>
                        isPinned
                          ? current.filter((id) => id !== chat.id)
                          : [chat.id, ...current]
                      )
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {isPinned ? (
                      <>
                        <PinOff className="mr-1 size-3.5" /> Désépingler
                      </>
                    ) : (
                      <>
                        <Pin className="mr-1 size-3.5" /> Épingler
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() =>
                      setArchivedChatIds((current) => current.filter((id) => id !== chat.id))
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <ArchiveRestore className="mr-1 size-3.5" /> Libérer
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
