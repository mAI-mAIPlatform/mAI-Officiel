const fs = require("fs");
let code = fs.readFileSync("components/chat/multimodal-input.tsx", "utf8");

// Remove ModelSelectorCompact from MultimodalInput Tools
code = code.replace(
  /<ModelSelectorCompact\s+onModelChange={onModelChange}\s+selectedModelId={selectedModelId}\s+\/>/g,
  ""
);

// We need to extract the ModelSelectorCompact component and its related logic into a separate file
// because we need it in chat-header.tsx and maybe elsewhere.
// Wait, we can keep it here, but chat-header doesn't have it.
// Let's create components/ai-elements/model-selector-compact.tsx

fs.writeFileSync("components/chat/multimodal-input.tsx", code);
