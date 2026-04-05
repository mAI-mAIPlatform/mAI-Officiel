const fs = require("fs");
let code = fs.readFileSync(
  "components/chat/model-selector-compact.tsx",
  "utf8"
);
code = code.replace(
  `import { cn } from "@/lib/utils";`,
  `import { cn } from "@/lib/utils";\nimport { BotIcon, BrainIcon, EyeIcon, FilePenLineIcon, WrenchIcon } from "lucide-react";`
);
fs.writeFileSync("components/chat/model-selector-compact.tsx", code);
