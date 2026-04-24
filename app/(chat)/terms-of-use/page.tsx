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
              Dernière mise à jour : 21 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">
          1. Acceptation et champ d&apos;application
        </h2>
        <p>
          En utilisant mAI, vous acceptez les présentes conditions. Elles
          s&apos;appliquent à l&apos;ensemble des fonctionnalités : chat,
          studio, bibliothèque, projets, extensions, plugins, et services
          associés.
        </p>
        <p>
          Si vous n&apos;acceptez pas ces conditions, vous devez cesser
          l&apos;utilisation du service.
        </p>

        <h2 className="text-base font-semibold">2. Compte utilisateur</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants, des
          actions réalisées depuis votre compte et du respect des bonnes
          pratiques de sécurité (mot de passe fort, verrouillage, vérification
          des appareils utilisés).
        </p>
        <p>
          Vous vous engagez à fournir des informations exactes et à ne pas
          usurper l&apos;identité d&apos;un tiers.
        </p>

        <h2 className="text-base font-semibold">
          3. Usages autorisés et interdits
        </h2>
        <p>
          L&apos;usage doit rester légal, loyal et non abusif. Sont interdits :
          contournement des limites, scraping agressif, fraude, compromission,
          génération de contenu illicite, harcèlement, ou utilisation visant à
          nuire à des tiers.
        </p>
        <p>
          En cas d&apos;usage suspect ou dangereux, des restrictions temporaires
          ou définitives peuvent être appliquées.
        </p>

        <h2 className="text-base font-semibold">
          4. Contenus générés par l&apos;IA
        </h2>
        <p>
          Les résultats générés peuvent être incomplets, inexacts ou non adaptés
          à votre contexte. Vous restez seul responsable de la vérification, de
          la conformité réglementaire et de l&apos;usage final des contenus.
        </p>
        <p>
          Le service ne constitue pas un conseil juridique, médical, financier
          ou professionnel.
        </p>

        <h2 className="text-base font-semibold">
          5. Disponibilité et évolution du service
        </h2>
        <p>
          Nous pouvons modifier, suspendre ou améliorer des fonctionnalités pour
          des raisons techniques, de sécurité, de conformité ou de performance.
          Nous faisons notre possible pour limiter les interruptions.
        </p>
        <p>
          Certaines fonctions peuvent être proposées en bêta et évoluer sans
          préavis.
        </p>

        <h2 className="text-base font-semibold">6. Propriété intellectuelle</h2>
        <p>
          Les éléments de la plateforme (marques, interface, composants
          propriétaires, charte visuelle) sont protégés. Toute reproduction,
          extraction substantielle ou exploitation non autorisée est interdite.
        </p>
        <p>
          Vous conservez vos droits sur vos contenus, sous réserve des licences
          nécessaires au fonctionnement du service.
        </p>

        <h2 className="text-base font-semibold">
          7. Limitation de responsabilité
        </h2>
        <p>
          Le service est fourni « en l&apos;état ». Dans les limites permises
          par la loi, mAI ne saurait être tenu responsable des dommages
          indirects, pertes d&apos;opportunité, indisponibilités temporaires ou
          pertes de données.
        </p>
        <p>
          Vous êtes responsable de la sauvegarde de vos contenus critiques avant
          export, publication ou suppression.
        </p>

        <h2 className="text-base font-semibold">
          8. Résiliation et suppression
        </h2>
        <p>
          Vous pouvez cesser d&apos;utiliser le service à tout moment. En cas
          d&apos;abus grave, de non-respect répété des règles ou de risque de
          sécurité, l&apos;accès peut être restreint, suspendu ou résilié.
        </p>

        <h2 className="text-base font-semibold">9. Tarification et quotas</h2>
        <p>
          Certains modèles et fonctionnalités sont soumis à des quotas, limites
          d&apos;usage ou plans payants. Les quotas peuvent être réinitialisés
          selon une périodicité définie par le plan actif.
        </p>

        <h2 className="text-base font-semibold">
          10. Droit applicable et litiges
        </h2>
        <p>
          Les présentes conditions sont régies par le droit applicable dans
          votre juridiction. En cas de litige, une résolution amiable est
          privilégiée avant toute procédure contentieuse.
        </p>

        <h2 className="text-base font-semibold">
          11. Mise à jour des conditions
        </h2>
        <p>
          Les conditions d&apos;utilisation peuvent être modifiées pour tenir
          compte des évolutions techniques, légales et du service. La date de
          dernière mise à jour fait foi.
        </p>
      </section>
    </div>
  );
}
