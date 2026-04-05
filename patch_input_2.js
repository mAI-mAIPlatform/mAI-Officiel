const fs = require("fs");
let code = fs.readFileSync("components/chat/multimodal-input.tsx", "utf8");
code = code.replace(
  /<select[\s\S]*?<option value="device">Local<\/option>\s*<option value="mai-library">Bibliothèque mAI<\/option>\s*<\/select>/g,
  ""
);
fs.writeFileSync("components/chat/multimodal-input.tsx", code);
