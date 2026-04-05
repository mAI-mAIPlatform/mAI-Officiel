import { generateText } from "ai";
import { NextResponse } from "next/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

export async function POST(request: Request) {
  try {
    const { url, fileContext, imageBase64 } = (await request.json()) as {
      url?: string;
      fileContext?: string;
      imageBase64?: string;
    };

    if (!url && !fileContext && !imageBase64) {
      return NextResponse.json(
        { error: "Veuillez fournir une URL, un fichier texte ou une image." },
        { status: 400 }
      );
    }

    let inputContext = "";

    if (url) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          // Simple regex to strip HTML tags and get text
          const stripped = html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ').trim();
          inputContext += `\nContenu extrait de l'URL (${url}):\n${stripped.slice(0, 10000)}`;
        } else {
          inputContext += `\nURL à analyser (Impossible de récupérer le contenu, veuillez l'analyser d'après l'URL): ${url}`;
        }
      } catch (err) {
        inputContext += `\nURL à analyser: ${url}`;
      }
    }

    if (fileContext) inputContext += `\nContenu du fichier:\n${fileContext.slice(0, 10000)}`;

    const messages: any[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analysez le contenu fourni et générez un rapport structuré avec les sections suivantes :\n1. Résumé\n2. Points clés\n3. Analyse de sentiment\n4. Conclusion\n\nContenu à analyser :${inputContext}`,
          },
        ],
      },
    ];

    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      messages[0].content.push({
        type: "image",
        image: base64Data,
      });
    }

    const { text } = await generateText({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      messages,
    });

    return NextResponse.json({ report: text });
  } catch (error) {
    console.error("mAnalyse error", error);
    return NextResponse.json({ error: "An error occurred during analysis" }, { status: 500 });
  }
}
