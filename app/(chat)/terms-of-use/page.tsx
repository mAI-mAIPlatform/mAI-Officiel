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
            <h1 className="text-2xl font-semibold">Conditions d&apos;utilisation</h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 21 avril 2026
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass space-y-4 rounded-2xl border border-border/50 bg-card/70 p-6 text-sm leading-6 backdrop-blur-xl">
        <h2 className="text-base font-semibold">1. Acceptation et champ d&apos;application</h2>
        <p>
          En utilisant mAI, vous acceptez les présentes conditions. Elles s&apos;appliquent à l&apos;ensemble des
          fonctionnalités (chat, studio, bibliothèque, projets, extensions et services associés).
        </p>

        <h2 className="text-base font-semibold">2. Compte utilisateur</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants, des actions menées depuis votre compte,
          et du respect des règles de sécurité recommandées (mot de passe fort, verrouillage de session, etc.).
        </p>

        <h2 className="text-base font-semibold">3. Usages autorisés et interdits</h2>
        <p>
          L&apos;usage doit rester légal, loyal et non abusif. Sont notamment interdits : le contournement des limites,
          les activités frauduleuses, les tentatives de compromission, la génération de contenus illégaux, ou
          l&apos;utilisation de la plateforme pour nuire à des tiers.
        </p>

        <h2 className="text-base font-semibold">4. Contenus générés par l&apos;IA</h2>
        <p>
          Les résultats générés peuvent être inexacts ou incomplets. Vous restez responsable de la vérification,
          de la conformité réglementaire et de l&apos;usage final des contenus exportés ou publiés.
        </p>

        <h2 className="text-base font-semibold">5. Disponibilité et évolution du service</h2>
        <p>
          Nous pouvons modifier, suspendre ou améliorer des fonctionnalités pour des raisons techniques,
          de sécurité, de conformité ou de performance. Nous faisons notre possible pour limiter les interruptions.
        </p>

        <h2 className="text-base font-semibold">6. Propriété intellectuelle</h2>
        <p>
          Les éléments de la plateforme (marques, interface, composants propriétaires) sont protégés. Toute
          reproduction ou exploitation non autorisée est interdite.
        </p>

        <h2 className="text-base font-semibold">7. Limitation de responsabilité</h2>
        <p>
          Le service est fourni « en l&apos;état ». Dans les limites permises par la loi, mAI ne saurait être tenu
          responsable des dommages indirects, pertes d&apos;opportunité ou pertes de données liées à l&apos;utilisation.
        </p>

        <h2 className="text-base font-semibold">8. Résiliation et suppression</h2>
        <p>
          Vous pouvez cesser d&apos;utiliser le service à tout moment. En cas d&apos;abus grave ou de violation répétée,
          l&apos;accès peut être restreint ou suspendu.
        </p>
      </section>
    </div>
  );
}
