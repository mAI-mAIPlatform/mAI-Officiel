import { extractJsonObjectsFromStream } from "@/lib/json-stream-parser";

interface ResponsesApiResponse {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
  response?: {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
    output_text?: string;
  };
}

interface ResponseTextDeltaEvent {
  delta?: string;
  text?: string;
  type?: string;
}

export function extractTextFromResponsesOutput(
  data: ResponsesApiResponse | undefined | null
): string {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim().length > 0
  ) {
    return data.output_text.trim();
  }
  if (
    typeof data?.response?.output_text === "string" &&
    data.response.output_text.trim().length > 0
  ) {
    return data.response.output_text.trim();
  }

  const fromStructuredOutput =
    (data?.output ?? data?.response?.output)
      ?.flatMap((outputItem) => outputItem.content ?? [])
      .map((contentItem) =>
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
          ? contentItem.text
          : ""
      )
      .join("") ?? "";

  return fromStructuredOutput.trim();
}

export function extractTextFromResponsesPayload(payload: unknown): string {
  if (!payload) {
    return "";
  }

  if (Array.isArray(payload)) {
    const parsedEvents = payload
      .map((entry) => {
        if (typeof entry === "string") {
          try {
            return JSON.parse(entry) as ResponseTextDeltaEvent;
          } catch {
            return null;
          }
        }
        return entry as ResponseTextDeltaEvent;
      })
      .filter((event): event is ResponseTextDeltaEvent => event !== null);

    const completedText = parsedEvents
      .filter(
        (event) =>
          event.type === "response.output_text.done" &&
          typeof event.text === "string"
      )
      .at(-1)?.text;

    if (completedText) {
      return completedText.trim();
    }

    return parsedEvents
      .map((event) => {
        if (
          event.type === "response.output_text.delta" &&
          typeof event.delta === "string"
        ) {
          return event.delta;
        }
        return "";
      })
      .join("")
      .trim();
  }

  if (typeof payload === "string") {
    const trimmedPayload = payload.trim();

    try {
      const parsed = JSON.parse(trimmedPayload) as unknown;
      return extractTextFromResponsesPayload(parsed);
    } catch {
      const streamEvents = extractJsonObjectsFromStream(trimmedPayload);
      if (streamEvents.length > 0) {
        return extractTextFromResponsesPayload(streamEvents);
      }
      return "";
    }
  }

  if (typeof payload === "object" && payload !== null && "type" in payload) {
    const event = payload as ResponseTextDeltaEvent;

    if (event.type === "response.output_text.done" && typeof event.text === "string") {
      return event.text.trim();
    }

    if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
      return event.delta.trim();
    }
  }

  return extractTextFromResponsesOutput(payload as ResponsesApiResponse);
}
