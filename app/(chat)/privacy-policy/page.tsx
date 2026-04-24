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
              Dernière mise à jour : 21 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">1. Données collectées</h2>
        <p>
          Nous collectons les données strictement nécessaires au fonctionnement
          du service : informations de compte (ex. email), préférences
          d&apos;interface, paramètres de personnalisation IA, historiques de
          conversation et métadonnées techniques minimales (horodatage,
          identifiant session, diagnostics d&apos;erreur).
        </p>
        <p>
          Certaines fonctionnalités (voix, plugins, outils externes, partage)
          peuvent générer des données supplémentaires propres à leur usage. Ces
          données restent limitées à la finalité de la fonctionnalité activée.
        </p>

        <h2 className="text-base font-semibold">2. Finalités de traitement</h2>
        <p>
          Les traitements servent à : (a) fournir et maintenir le service, (b)
          sécuriser la plateforme et prévenir les abus, (c) personnaliser
          l&apos;expérience, (d) mesurer la qualité et la performance, (e)
          respecter nos obligations légales.
        </p>
        <p>
          Lorsque vous activez des options facultatives, les données associées
          peuvent être utilisées pour améliorer l&apos;expérience utilisateur
          (ex. préférences, contexte personnel, réglages de réflexion/modèle).
        </p>

        <h2 className="text-base font-semibold">
          3. Base légale et consentement
        </h2>
        <p>
          Selon votre juridiction, le traitement repose sur l&apos;exécution du
          contrat de service, notre intérêt légitime (sécurité, stabilité,
          support), et/ou votre consentement explicite pour les finalités
          optionnelles.
        </p>
        <p>
          Vous pouvez retirer votre consentement aux fonctionnalités non
          essentielles à tout moment depuis les paramètres, sans impact sur les
          fonctions strictement nécessaires au service.
        </p>

        <h2 className="text-base font-semibold">
          4. Option “Améliorer mAI pour tous”
        </h2>
        <p>
          Cette option est désactivée par défaut. Lorsqu&apos;elle est activée,
          vous autorisez l&apos;utilisation de certains contenus pour améliorer
          les modèles et la qualité globale. Des mesures de minimisation et de
          protection de la vie privée sont appliquées.
        </p>
        <p>
          Si cette option est désactivée, vos contenus ne sont pas utilisés pour
          l&apos;amélioration générale, hors obligations légales ou besoins
          stricts de sécurité/anti-abus.
        </p>

        <h2 className="text-base font-semibold">
          5. Conservation et suppression
        </h2>
        <p>
          Les données sont conservées pendant une durée proportionnée à leur
          finalité. Elles sont ensuite supprimées, agrégées ou anonymisées selon
          les contraintes légales, de sécurité et de traçabilité.
        </p>
        <p>
          Les conversations, préférences et historiques locaux peuvent aussi
          être stockés côté navigateur (localStorage) selon les modules activés.
        </p>

        <h2 className="text-base font-semibold">
          6. Partage et sous-traitance
        </h2>
        <p>
          Nous pouvons recourir à des prestataires pour l&apos;hébergement, la
          sécurité, la notification, le traitement IA ou des outils externes.
          Ces sous-traitants sont encadrés par des obligations contractuelles de
          confidentialité et de sécurité.
        </p>
        <p>
          Nous ne vendons pas vos données personnelles. Les transferts hors de
          votre pays sont encadrés par des mécanismes juridiques appropriés,
          lorsque requis.
        </p>

        <h2 className="text-base font-semibold">7. Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification,
          l&apos;effacement, l&apos;export, la limitation ou l&apos;opposition,
          conformément à la réglementation applicable.
        </p>
        <p>
          Pour exercer vos droits, utilisez les fonctionnalités d&apos;export et
          de gestion disponibles dans l&apos;application, puis contactez le
          support si besoin d&apos;une assistance complémentaire.
        </p>

        <h2 className="text-base font-semibold">8. Sécurité</h2>
        <p>
          Nous mettons en place des mesures techniques et organisationnelles
          raisonnables : contrôle d&apos;accès, surveillance des abus,
          journalisation de sécurité, et protections applicatives.
        </p>
        <p>
          Aucune méthode n&apos;étant infaillible, vous restez responsable des
          informations sensibles partagées volontairement dans vos messages.
        </p>

        <h2 className="text-base font-semibold">
          9. Mineurs et contrôle parental
        </h2>
        <p>
          Des paramètres de contrôle parental sont disponibles pour limiter
          l&apos;usage et certaines extensions. Les parents/tuteurs restent
          responsables de l&apos;encadrement des mineurs.
        </p>

        <h2 className="text-base font-semibold">
          10. Mise à jour de la politique
        </h2>
        <p>
          Cette politique peut évoluer pour refléter des changements
          réglementaires, techniques ou fonctionnels. La date de dernière mise à
          jour est indiquée en haut de page.
        </p>
      </section>
    </div>
  );
}
