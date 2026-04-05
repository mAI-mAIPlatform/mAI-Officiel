const fs = require("fs");
let code = fs.readFileSync(
  "components/chat/model-selector-compact.tsx",
  "utf8"
);
code = code.replace(
  `import { BotIcon, BrainIcon, EyeIcon, FilePenLineIcon, WrenchIcon } from "lucide-react";`,
  `import { BotIcon, BrainIcon, EyeIcon, FilePenLineIcon, WrenchIcon, LockIcon } from "lucide-react";`
);
fs.writeFileSync("components/chat/model-selector-compact.tsx", code);
