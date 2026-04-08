import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="size-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              Politique de confidentialité
            </h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 8 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">1. Données collectées</h2>
        <p>
          Nous collectons uniquement les données nécessaires au fonctionnement
          de l&apos;application : informations de compte, préférences,
          historiques de conversation et données techniques minimales
          (journalisation et sécurité).
        </p>

        <h2 className="text-base font-semibold">2. Utilisation des données</h2>
        <p>
          Les données sont utilisées pour personnaliser l&apos;expérience,
          améliorer la qualité des réponses, sécuriser le service et respecter
          les obligations légales applicables.
        </p>

        <h2 className="text-base font-semibold">3. Conservation</h2>
        <p>
          Les données sont conservées pendant la durée strictement nécessaire à
          la finalité du service, puis supprimées ou anonymisées selon les
          contraintes légales et opérationnelles.
        </p>

        <h2 className="text-base font-semibold">4. Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la correction, l&apos;export ou la
          suppression de vos données personnelles, ainsi que retirer certains
          consentements selon votre juridiction.
        </p>
      </section>
    </div>
  );
}
