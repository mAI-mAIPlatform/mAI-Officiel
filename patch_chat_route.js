const fs = require("fs");
let code = fs.readFileSync("app/(chat)/api/chat/route.ts", "utf8");

// We need to implement a credit limit check.
// In this template, limits are probably managed somewhere. If not, we will mock it to return an error when limits are 0.
// We'll search where AI Gateway returns credit limit. We already found lines 403-406.

code = code.replace(
  `"AI Gateway requires a valid credit card on file to service requests"`,
  `"AI Gateway requires a valid credit card on file to service requests" || error.message?.includes("solde est épuisé")`
);

code = code.replace(
  `return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";`,
  `return "Solde de crédits épuisé. Veuillez recharger vos crédits ou passer à un forfait supérieur pour continuer.";`
);

fs.writeFileSync("app/(chat)/api/chat/route.ts", code);
