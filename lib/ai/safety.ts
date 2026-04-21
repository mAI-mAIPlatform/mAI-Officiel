const MAX_USER_PROMPT_LENGTH = 2000;
const MAX_USER_PROMPT_LINES = 120;

const HIGH_RISK_PATTERNS = [
  /\b(how to|comment)\s+(build|make|fabriquer)\s+(a\s+)?bomb\b/i,
  /\b(exploit|sqlmap|xss|rce|payload)\b/i,
  /\b(credential\s*stuffing|brute\s*force|phishing)\b/i,
  /\b(self[- ]?harm|suicide)\b/i,
  /\b(fentanyl|ricin|napalm|tannerite)\b/i,
  /\b(3d[- ]?printed?\s+gun|ghost\s+gun)\b/i,
  /\b(commande|command)\s+rm\s+-rf\s+\/?\b/i,
] as const;

const SENSITIVE_PROMPT_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /bypass\s+(security|guardrails|restrictions)/i,
  /reveal\s+(system|hidden)\s+prompt/i,
  /affiche\s+les\s+instructions\s+système/i,
  /\b(base64|rot13|hex)\b.{0,30}\b(instructions?|prompt|payload)\b/i,
  /\b(simule|pretend|act as)\b.{0,40}\b(admin|system|root)\b/i,
] as const;

export function normalizePromptInput(input: string): string {
  return input
    .replaceAll("\u0000", "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .slice(0, MAX_USER_PROMPT_LENGTH);
}

export function validatePromptSafety(input: string): {
  blocked: boolean;
  reason?: string;
} {
  const normalized = normalizePromptInput(input);

  if (!normalized) {
    return { blocked: true, reason: "empty_prompt" };
  }

  if (normalized.split(/\r?\n/).length > MAX_USER_PROMPT_LINES) {
    return { blocked: true, reason: "prompt_too_long" };
  }

  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { blocked: true, reason: "high_risk_prompt" };
  }

  if (SENSITIVE_PROMPT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { blocked: true, reason: "prompt_injection_attempt" };
  }

  return { blocked: false };
}
