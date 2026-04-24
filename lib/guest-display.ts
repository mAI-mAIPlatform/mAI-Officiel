import { guestRegex } from "@/lib/constants";

const guestDisplayPool = [
  "Supporter",
  "Fan",
  "Membre",
  "Passionné",
  "Curieux",
  "Amateur",
  "Fidèle",
  "Abonné",
  "Participant",
  "Observateur",
  "Admirateur",
  "Enthousiaste",
  "Suiveur",
  "Utilisateur",
  "Contributeur",
  "Explorateur",
  "Joueur",
  "Apprenant",
  "Initié",
  "Insider",
  "Beta-testeur",
  "Early adopter",
  "Client",
  "Visiteur",
  "Spectateur",
] as const;

function stableIndex(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % guestDisplayPool.length;
}

export function getGuestDisplayName(email?: string | null): string | null {
  const localPart = email?.split("@")[0]?.trim() ?? "";
  if (!guestRegex.test(localPart)) {
    return null;
  }

  return guestDisplayPool[stableIndex(localPart)] ?? "Visiteur";
}
