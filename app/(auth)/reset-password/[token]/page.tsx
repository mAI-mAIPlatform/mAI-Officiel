"use client";

import { useActionState, useEffect } from "react";
import { resetPasswordWithToken } from "../../actions";
import { toast } from "@/components/chat/toast";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, action] = useActionState(resetPasswordWithToken, { status: "failed" as const });

  useEffect(() => {
    if (state.status === "success") {
      toast({ type: "success", description: "Mot de passe mis à jour." });
      router.push("/login");
    } else if (state.status === "invalid_token") {
      toast({ type: "error", description: "Lien invalide ou expiré." });
    } else if (state.status === "invalid_data") {
      toast({ type: "error", description: "Le mot de passe doit contenir au moins 8 caractères avec lettres et chiffres." });
    }
  }, [router, state.status]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
      <form action={action} className="space-y-3">
        <input name="token" type="hidden" value={String(params.token ?? "")} />
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2" minLength={8} name="password" placeholder="Nouveau mot de passe" required type="password" />
        <button className="w-full rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white" type="submit">Réinitialiser</button>
      </form>
    </div>
  );
}
