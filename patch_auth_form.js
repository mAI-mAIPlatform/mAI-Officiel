const fs = require("fs");
let code = fs.readFileSync("components/chat/auth-form.tsx", "utf8");

code = code.replace(
  `        <Label className="font-normal text-muted-foreground" htmlFor="email">
          Email
        </Label>`,
  `        <Label className="font-normal text-muted-foreground" htmlFor="email">
          Adresse e-mail
        </Label>`
);

code = code.replace(
  `        <Label className="font-normal text-muted-foreground" htmlFor="password">
          Password
        </Label>`,
  `        <Label className="font-normal text-muted-foreground" htmlFor="password">
          Mot de passe
        </Label>`
);

fs.writeFileSync("components/chat/auth-form.tsx", code);
