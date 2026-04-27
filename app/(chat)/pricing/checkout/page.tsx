"use client";

import { ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { planDefinitions, type PlanKey } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export default function PricingCheckoutPage() {
  const params = useSearchParams();

  // ✅ FIX: optional chaining — useSearchParams() peut retourner null dans Next.js 16
  const requestedPlan = (params?.get("plan") ?? "plus") as PlanKey;
  const plan = requestedPlan in planDefinitions ? requestedPlan : "plus";
  const { activateByCode, isActivating } = useSubscriptionPlan();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const includedFeatures = useMemo(
    () => [
      `Messages: ${planDefinitions[plan].limits.messagesPerHour}/heure`,
      `Fichiers: ${planDefinitions[plan].limits.filesPerDay}/jour`,
      `Taille max fichier: ${planDefinitions[plan].limits.maxFileSizeMb} MB`,
      `Mémoire IA: ${planDefinitions[plan].limits.memoryUnits} unités`,
      `Recherche web: ${planDefinitions[plan].limits.webSearchesPerDay}/jour`,
      `Actualités: ${planDefinitions[plan].limits.newsSearchesPerDay}/jour`,
      `Repas (CookAI): ${planDefinitions[plan].limits.mealsSearchesPerDay}/jour`,
      `mAIHealth: ${planDefinitions[plan].limits.healthRequestsPerMonth}/mois`,
      `Studio: ${planDefinitions[plan].limits.studioImagesPerDay} images/jour`,
      `Wave: ${planDefinitions[plan].limits.musicGenerationsPerWeek}/semaine`,
      `Quiz: ${planDefinitions[plan].limits.quizPerDay}`,
    ],
    [plan]
  );

  const isFormValid = useMemo(
    () =>
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      email.includes("@") &&
      address.trim().length > 3 &&
      city.trim().length > 1 &&
      country.trim().length > 1 &&
      postalCode.trim().length > 2 &&
      code.trim().length > 0 &&
      termsAccepted,
    [
      address,
      city,
      code,
      country,
      email,
      firstName,
      lastName,
      postalCode,
      termsAccepted,
    ]
  );

  const submit = async () => {
    if (!termsAccepted) {
      setFeedback({
        type: "error",
        text: "Vous devez accepter les conditions d'utilisation pour continuer.",
      });
      return;
    }

    const activatedPlan = await activateByCode(code);
    if (!activatedPlan || activatedPlan !== plan) {
      setFeedback({
        type: "error",
        text: `Code invalide pour ${planDefinitions[plan].label}.`,
      });
      return;
    }

    setFeedback({
      type: "success",
      text: `${planDefinitions[plan].label} activé avec succès. Bienvenue sur votre nouveau forfait.`,
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-8">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/pricing"
      >
        <ArrowLeft className="size-4" />
        Retour aux forfaits
      </Link>

      <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Configurer votre forfait</h1>
          <p className="text-sm text-muted-foreground">
            Renseignez vos informations de facturation pour finaliser
            l&apos;activation de votre forfait.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Prénom"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <Input
              placeholder="Nom"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Téléphone (optionnel)"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Adresse"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <Input
              placeholder="Ville"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
            <Input
              placeholder="Pays"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
            <Input
              placeholder="Code postal"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder={`Code ${planDefinitions[plan].label}`}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <label className="mt-1 flex items-start gap-2 text-sm">
            <input
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              type="checkbox"
            />
            J&apos;accepte les conditions d&apos;utilisation et la politique de
            confidentialité.
          </label>
          <Button
            disabled={isActivating || !isFormValid}
            onClick={submit}
            type="button"
          >
            <CreditCard className="mr-2 size-4" />
            {isActivating ? "Validation..." : "Passer au forfait et activer"}
          </Button>
          {feedback ? (
            <p
              className={cn(
                "text-sm",
                feedback.type === "success"
                  ? "text-emerald-600"
                  : "text-rose-600"
              )}
            >
              {feedback.text}
            </p>
          ) : null}
        </div>
        <aside className="rounded-xl border border-border/50 bg-background/70 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Forfait sélectionné
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {planDefinitions[plan].label}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Fonctionnalités incluses
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {includedFeatures.map((feature) => (
              <li className="flex items-start gap-2" key={feature}>
                <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
