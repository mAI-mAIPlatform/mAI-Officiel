"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (!searchParams) return;
    const referral = searchParams.get("ref");
    if (referral) localStorage.setItem("mai.quizzly.referral.code.v1", referral);
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Un compte existe déjà !" });
    } else if (state.status === "rate_limited") {
      toast({
        type: "error",
        description:
          "Inscription limitée à 1 compte par IP et par mois. Réessayez plus tard.",
      });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Erreur lors de la création du compte" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Erreur lors de la demande",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Compte créé !" });
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="text-sm text-muted-foreground">
        Commencez gratuitement avec une configuration rapide.
      </p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>S'inscrire</SubmitButton>
        <p className="text-center text-[12px] text-muted-foreground">Mot de passe: 8+ caractères avec lettres et chiffres.</p>
        <div className="space-y-2">
          <button className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => signIn("google", { callbackUrl: "/" })} type="button">S'inscrire avec Google</button>
          <button className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => signIn("apple", { callbackUrl: "/" })} type="button">S'inscrire avec Apple</button>
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Vous avez un compte ? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Se connecter
          </Link>
        </p>
      </AuthForm>
    </>
  );
}
