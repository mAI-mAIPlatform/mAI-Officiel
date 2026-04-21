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
            <h1 className="text-2xl font-semibold">Politique de confidentialité</h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 21 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">1. Données collectées</h2>
        <p>
          Nous collectons les données strictement nécessaires au fonctionnement : informations de compte,
          paramètres de personnalisation, historique d&apos;utilisation, journaux techniques de sécurité et
          métadonnées opérationnelles minimales.
        </p>

        <h2 className="text-base font-semibold">2. Finalités de traitement</h2>
        <p>
          Les données servent à fournir le service, améliorer la qualité des réponses, prévenir les abus,
          personnaliser l&apos;expérience, assurer la stabilité et respecter les obligations légales.
        </p>

        <h2 className="text-base font-semibold">3. Base légale et consentement</h2>
        <p>
          Selon votre juridiction, le traitement repose sur l&apos;exécution du service, l&apos;intérêt légitime,
          et/ou votre consentement explicite pour certaines finalités optionnelles.
        </p>

        <h2 className="text-base font-semibold">4. Option “Améliorer mAI pour tous”</h2>
        <p>
          Cette option est désactivée par défaut. Lorsqu&apos;elle est activée, vous autorisez l&apos;utilisation de
          certains contenus pour améliorer les modèles et la performance globale. Des mesures de protection
          de la vie privée sont appliquées.
        </p>

        <h2 className="text-base font-semibold">5. Conservation et suppression</h2>
        <p>
          Les données sont conservées pour la durée nécessaire à la finalité poursuivie, puis supprimées,
          agrégées ou anonymisées selon les contraintes légales et techniques.
        </p>

        <h2 className="text-base font-semibold">6. Partage et sous-traitance</h2>
        <p>
          Nous pouvons recourir à des prestataires techniques pour l&apos;hébergement, la sécurité ou certaines
          capacités IA, avec des obligations contractuelles de confidentialité et de protection des données.
        </p>

        <h2 className="text-base font-semibold">7. Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification, l&apos;effacement, l&apos;export, la limitation ou l&apos;opposition,
          conformément aux règles applicables dans votre pays.
        </p>
      </section>
    </div>
  );
}
