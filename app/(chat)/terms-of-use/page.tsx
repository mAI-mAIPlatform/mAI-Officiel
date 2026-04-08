import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function TermsOfUsePage() {
  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-4xl flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-6 backdrop-blur-xl">
        <Link
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          href="/settings"
        >
          <ArrowLeft className="size-4" />
          Retour aux paramètres
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border/50 bg-background/70 p-2">
            <FileText className="size-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              Conditions d&apos;utilisation
            </h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 8 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">1. Acceptation</h2>
        <p>
          En utilisant ce service, vous acceptez les présentes conditions, ainsi
          que les lois et règlements applicables à votre pays de résidence.
        </p>

        <h2 className="text-base font-semibold">2. Usage autorisé</h2>
        <p>
          Vous vous engagez à utiliser la plateforme de manière légale,
          responsable et respectueuse. Toute tentative d&apos;abus,
          d&apos;ingénierie malveillante ou de contournement des limitations est
          interdite.
        </p>

        <h2 className="text-base font-semibold">3. Compte et sécurité</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et des
          actions réalisées depuis votre compte. Signalez immédiatement tout
          accès non autorisé.
        </p>

        <h2 className="text-base font-semibold">
          4. Limitation de responsabilité
        </h2>
        <p>
          Le service est fourni « tel quel ». Nous faisons le maximum pour
          assurer la disponibilité et la fiabilité, sans garantie absolue
          d&apos;absence d&apos;interruption ou d&apos;erreur.
        </p>
      </section>
    </div>
  );
}
