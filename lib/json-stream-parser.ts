/**
 * Extracts JSON objects from a raw concatenated stream string (e.g. OpenAI Responses API).
 * Walks char by char, tracks brace depth and string escaping. Malformed chunks are skipped.
 */
export function extractJsonObjectsFromStream(raw: string): unknown[] {
  const events: unknown[] = [];
  let depth = 0,
    startIndex = -1,
    isInsideString = false,
    isEscaped = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (isInsideString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (c === "\\") {
        isEscaped = true;
        continue;
      }
      if (c === '"') {
        isInsideString = false;
      }
      continue;
    }
    if (c === '"') {
      isInsideString = true;
      continue;
    }
    if (c === "{") {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
      continue;
    }
    if (c === "}") {
      depth--;
      if (depth === 0 && startIndex >= 0) {
        try {
          events.push(JSON.parse(raw.slice(startIndex, i + 1)));
        } catch {}
        startIndex = -1;
      }
    }
  }
  return events;
}
