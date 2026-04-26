"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { requestPasswordReset } from "../actions";
import { toast } from "@/components/chat/toast";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, { status: "failed" as const });

  useEffect(() => {
    if (state.status === "success") {
      toast({ type: "success", description: "Si le compte existe, un lien de réinitialisation a été envoyé." });
    }
    if (state.status === "failed") {
      toast({ type: "error", description: "Impossible de traiter la demande." });
    }
  }, [state.status]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Récupération de compte</h1>
      <p className="text-sm text-muted-foreground">Entrez votre email pour recevoir un lien sécurisé de réinitialisation.</p>
      <form action={action} className="space-y-3">
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2" name="email" placeholder="email@exemple.com" required type="email" />
        <button className="w-full rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white" type="submit">Envoyer le lien</button>
      </form>
      <p className="text-center text-[13px] text-muted-foreground"><Link href="/login" className="underline">Retour à la connexion</Link></p>
    </div>
  );
}
