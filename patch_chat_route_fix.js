const fs = require("fs");
let code = fs.readFileSync("app/(chat)/api/chat/route.ts", "utf8");

code = code.replace(
  `error.message?.includes(
            "AI Gateway requires a valid credit card on file to service requests" || error.message?.includes("solde est épuisé")
          )`,
  `(error.message?.includes("AI Gateway requires a valid credit card on file to service requests") || error.message?.includes("solde est épuisé"))`
);

code = code.replace(
  `"AI Gateway requires a valid credit card on file to service requests" || error.message?.includes("solde est épuisé")`,
  `"AI Gateway requires a valid credit card on file to service requests" || error.message?.includes("solde est épuisé")`
);

fs.writeFileSync("app/(chat)/api/chat/route.ts", code);
