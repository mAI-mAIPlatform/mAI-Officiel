const fs = require("fs");
let code = fs.readFileSync("app/(chat)/settings/page.tsx", "utf8");

code = code.replace(
  "Version active : <strong>0.2.0</strong>",
  "Version active : <strong>0.4.0</strong>"
);

fs.writeFileSync("app/(chat)/settings/page.tsx", code);
