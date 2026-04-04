import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description: "Search the web for up-to-date information, news, or general knowledge.",
  inputSchema: z.object({
    query: z.string().describe("The search query to send to the web search engine."),
  }),
  execute: async (input) => {
    try {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) {
        return { error: "Clé API SerpAPI non configurée." };
      }

      const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(input.query)}&api_key=${apiKey}&engine=google`);

      if (!response.ok) {
        return { error: `Erreur SerpAPI: ${response.statusText}` };
      }

      const data = await response.json();

      // Extraction basique des résultats organiques
      const organicResults = data.organic_results || [];
      const results = organicResults.slice(0, 5).map((result: any) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
      }));

      return { results };
    } catch (error) {
      console.error("Web Search Tool Error:", error);
      return { error: "Échec de la recherche web." };
    }
  },
});
