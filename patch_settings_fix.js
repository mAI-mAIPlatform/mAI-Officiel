const fs = require("fs");
let code = fs.readFileSync("app/(chat)/settings/page.tsx", "utf8");

// The original import might have been replaced improperly, let's fix the imports.
if (!code.includes("MessageSquare,")) {
  code = code.replace(
    `import {
  Bell,`,
    `import {
  Bell,
  MessageSquare,`
  );
}

fs.writeFileSync("app/(chat)/settings/page.tsx", code);
