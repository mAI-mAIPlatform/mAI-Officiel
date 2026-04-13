import { tool } from "ai";
import { z } from "zod";
import { normalizePromptInput, validatePromptSafety } from "@/lib/ai/safety";

const DEFAULT_ALLOWED_WEB_SEARCH_DOMAINS = [
  "wikipedia.org",
  "who.int",
  "education.gouv.fr",
  "service-public.fr",
  "gouv.fr",
  "legifrance.gouv.fr",
  "cnil.fr",
  "insee.fr",
  "data.gouv.fr",
  "openai.com",
  "nextjs.org",
  "supabase.com",
  "vercel.com",
] as const;

const allowedDomains = (
  process.env.WEB_SEARCH_ALLOWED_DOMAINS
    ?.split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean) ?? [...DEFAULT_ALLOWED_WEB_SEARCH_DOMAINS]
) as string[];

function isAllowedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export const webSearch = tool({
  description:
    "Search the web for up-to-date information, news, or general knowledge.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to send to the web search engine."),
  }),
  execute: async (input) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return { error: "Clé API Tavily non configurée." };
      }

      const sanitizedQuery = normalizePromptInput(input.query);
      const safety = validatePromptSafety(sanitizedQuery);

      if (safety.blocked) {
        return {
          error:
            "Requête bloquée par la politique de sécurité (contenu sensible ou dangereux).",
        };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: sanitizedQuery,
          max_results: 20,
          include_answer: true,
          include_raw_content: false,
          search_depth: "advanced",
        }),
      });

      if (!response.ok) {
        return { error: `Erreur Tavily: ${response.statusText}` };
      }

      const data = (await response.json()) as {
        answer?: string;
        query?: string;
        results?: Array<{
          content?: string;
          score?: number;
          title?: string;
          url?: string;
        }>;
      };

      const filteredResults = (data.results ?? []).filter((result) =>
        result.url ? isAllowedDomain(result.url) : false
      );

      const results = filteredResults.slice(0, 12).map((result) => ({
        score: result.score ?? 0,
        snippet: result.content ?? "",
        title: result.title ?? "Sans titre",
        url: result.url ?? "",
      }));

      return {
        answer: data.answer ?? "",
        query: data.query ?? sanitizedQuery,
        rejectedResultsCount: Math.max((data.results?.length ?? 0) - results.length, 0),
        results,
      };
    } catch (error) {
      console.error("Web Search Tool Error:", error);
      return { error: "Échec de la recherche web." };
    }
  },
});
