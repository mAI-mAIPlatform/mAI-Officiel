export type ModerationReason =
  | "Insulte ou harcèlement"
  | "Spam"
  | "Contenu inapproprié"
  | "Tentative d'arnaque"
  | "Partage d'informations personnelles"
  | "Autre";

export type UserModerationStatus = {
  warnings: number;
  offenseCount: number;
  mutedUntil?: string;
  bannedUntil?: string;
  permanentlyBanned?: boolean;
  lastReason?: ModerationReason;
};

const insultPatterns = [/\bidiot\b/i, /\bdebile\b/i, /\bconnard\b/i, /\bimbecile\b/i, /\bnul\b/i];
const scamPatterns = [/\bpaypal\b/i, /\bcrypto\b/i, /\binvest\b/i, /\bargent facile\b/i, /\bcarte cadeau\b/i];
const inappropriatePatterns = [/\bsex\b/i, /\bporno\b/i, /\bnsfw\b/i];
const phonePattern = /(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}/;
const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const addressPattern = /\b(rue|avenue|boulevard|bd|impasse|all[ée]e)\b/i;

export function analyzeMessageForModeration(text: string, recentMessages: string[] = []) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { blocked: false, reasons: [] as ModerationReason[] };
  }

  const reasons = new Set<ModerationReason>();
  if (insultPatterns.some((pattern) => pattern.test(trimmed))) reasons.add("Insulte ou harcèlement");
  if (inappropriatePatterns.some((pattern) => pattern.test(trimmed))) reasons.add("Contenu inapproprié");
  if (scamPatterns.some((pattern) => pattern.test(trimmed))) reasons.add("Tentative d'arnaque");
  if (phonePattern.test(trimmed) || emailPattern.test(trimmed) || addressPattern.test(trimmed)) reasons.add("Partage d'informations personnelles");

  const normalized = trimmed.toLowerCase();
  const repeats = recentMessages.filter((item) => item.toLowerCase().trim() === normalized).length;
  if (repeats >= 2) reasons.add("Spam");

  return {
    blocked: reasons.size > 0,
    reasons: Array.from(reasons),
    replacementText: "[Message filtré automatiquement par la modération]",
  };
}

export function getNextSanction(status: UserModerationStatus): { action: "warn" | "mute24h" | "ban7d" | "permaban"; next: UserModerationStatus } {
  const nextOffense = (status.offenseCount ?? 0) + 1;
  const now = Date.now();
  if (nextOffense === 1) {
    return {
      action: "warn",
      next: { ...status, warnings: (status.warnings ?? 0) + 1, offenseCount: nextOffense },
    };
  }
  if (nextOffense === 2) {
    return {
      action: "mute24h",
      next: { ...status, warnings: status.warnings ?? 0, offenseCount: nextOffense, mutedUntil: new Date(now + 24 * 60 * 60 * 1000).toISOString() },
    };
  }
  if (nextOffense === 3) {
    return {
      action: "ban7d",
      next: { ...status, warnings: status.warnings ?? 0, offenseCount: nextOffense, bannedUntil: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString() },
    };
  }
  return {
    action: "permaban",
    next: { ...status, warnings: status.warnings ?? 0, offenseCount: nextOffense, permanentlyBanned: true },
  };
}

export function getSendRestriction(status?: UserModerationStatus) {
  if (!status) return { blocked: false, reason: "" };
  if (status.permanentlyBanned) return { blocked: true, reason: "Compte banni définitivement." };
  if (status.bannedUntil && new Date(status.bannedUntil).getTime() > Date.now()) {
    return { blocked: true, reason: `Compte banni temporairement jusqu'au ${new Date(status.bannedUntil).toLocaleString("fr-FR")}.` };
  }
  if (status.mutedUntil && new Date(status.mutedUntil).getTime() > Date.now()) {
    return { blocked: true, reason: `Compte muté jusqu'au ${new Date(status.mutedUntil).toLocaleString("fr-FR")}.` };
  }
  return { blocked: false, reason: "" };
}
