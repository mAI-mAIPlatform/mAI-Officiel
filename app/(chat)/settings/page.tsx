"use client";

import { Info, Settings2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data } = useSession();

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Settings2 className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
          v0.1.2
        </span>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
        <h2 className="text-lg font-semibold">Compte</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecté en tant que : {data?.user?.email ?? "Invité"}
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline">
            <a download href="/api/export">
              Exporter mes données
            </a>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
        <h2 className="text-lg font-semibold">À propos</h2>
        <div className="mt-3 rounded-xl border border-border/40 bg-background/60 p-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Info className="size-4" /> mAI Plateforme
          </p>
          <p className="mt-2">
            Cette section centralise maintenant les informations qui étaient sur
            la page À propos, directement dans Paramètres.
          </p>
          <Link
            className="mt-3 inline-block text-primary underline-offset-2 hover:underline"
            href="/about"
          >
            Voir la page complète À propos
          </Link>
        </div>
      </section>
    </div>
  );
}
