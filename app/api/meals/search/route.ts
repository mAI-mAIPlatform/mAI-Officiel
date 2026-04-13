import { NextResponse } from "next/server";


interface SearchResultItem {
  link?: string;
  snippet?: string;
  source?: string;
  title?: string;
}

export async function POST(request: Request) {
  try {
    const { query, fileContext } = (await request.json()) as {
      fileContext?: string;
      query?: string;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "mSearch non configuré. Contactez l'administrateur.",
        },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      engine: "google",
      gl: "fr",
      hl: "fr",
      num: "8",
      q: fileContext?.trim()
        ? `recette repas ${query} contexte fichier: ${fileContext.slice(0, 1000)}`
        : `recette repas ${query}`, // Add keywords for recipes
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`
    );
    const data = await response.json();

    const organicResults = (data.organic_results ?? [])
      .slice(0, 8)
      .map((item: SearchResultItem) => ({
        link: item.link,
        snippet: item.snippet,
        source: item.source,
        title: item.title,
      }));

    const report = organicResults
      .map(
        (result: SearchResultItem, index: number) =>
          `${index + 1}. ${result.title}\nSource: ${result.source ?? "Web"}\nRésumé: ${result.snippet ?? "Aucun extrait disponible."}`
      )
      .join("\n\n");

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      organicResults,
      report,
    });
  } catch (error) {
    console.error("meals search error", error);
    return NextResponse.json({ error: "News search failed" }, { status: 500 });
  }
}
