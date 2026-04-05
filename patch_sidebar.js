const fs = require("fs");
let code = fs.readFileSync("components/chat/app-sidebar.tsx", "utf8");
code = code.replace(
  `                  {
                    href: "/coder",
                    icon: Code2,
                    label: "Coder",
                    restricted: true,
                  },
                  {
                    href: "/news",
                    icon: Newspaper,
                    label: "Actualités",
                    restricted: true,
                  },
                  {
                    href: "/translation",
                    icon: Languages,
                    label: "Traduction",
                  },
                  {
                    href: "/Health",
                    icon: HeartPulse,
                    label: "mAIHealth",
                    beta: true,
                  },
                  {
                    href: "/studio",
                    icon: Sparkles,
                    label: "Studio",
                  },`,
  ""
);

code = code.replace(
  `                  { href: "/mais", icon: BotIcon, label: "Mes mAIs" },`,
  `                  { href: "/mais", icon: BotIcon, label: "Mes mAIs" },\n                  { href: "/extensions", icon: Sparkles, label: "Extensions" },`
);

code = code.replace(
  `import {
  AlertDialog,`,
  `import { BlocksIcon } from "lucide-react";\nimport {
  AlertDialog,`
);

code = code.replace(
  `icon: Sparkles, label: "Extensions"`,
  `icon: BlocksIcon, label: "Extensions"`
);

fs.writeFileSync("components/chat/app-sidebar.tsx", code);
