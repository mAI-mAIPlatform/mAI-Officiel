import re

with open("lib/ai/external-providers.ts", "r") as f:
    content = f.read()

content = re.sub(
    r'export async function generateResponse\(input: {\n  model: string;\n  messages: Array<\{ role: string; content: string \}>;\n  timeoutMs\?: number;\n  reasoningEffort\?: string;\n}\)',
    r'export async function generateResponse(input: {\n  model: string;\n  messages: Array<{ role: string; content: string }>;\n  timeoutMs?: number;\n  reasoningEffort?: "low" | "medium" | "high";\n})',
    content
)

content = re.sub(
    r'export async function runExternalTextModel\(\n  modelId: string,\n  messages: Array<\{ role: string; content: string \}>,\n  options\?: \{ reasoningEffort\?: string \}\n\)',
    r'export async function runExternalTextModel(\n  modelId: string,\n  messages: Array<{ role: string; content: string }>,\n  options?: { reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" }\n)',
    content
)

content = re.sub(
    r'\.\.\.\(input\.reasoningEffort \? \{ reasoning_effort: input\.reasoningEffort \} : \{\}\),',
    r'...((input.reasoningEffort && ["low", "medium", "high"].includes(input.reasoningEffort)) ? { reasoning_effort: input.reasoningEffort as "low" | "medium" | "high" } : {}),',
    content
)

content = re.sub(
    r'reasoningEffort: options\?\.reasoningEffort,',
    r'reasoningEffort: options?.reasoningEffort === "none" || options?.reasoningEffort === "minimal" ? undefined : options?.reasoningEffort,',
    content
)

with open("lib/ai/external-providers.ts", "w") as f:
    f.write(content)
