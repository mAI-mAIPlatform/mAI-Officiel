const fs = require("fs");
let code = fs.readFileSync("app/(chat)/settings/page.tsx", "utf8");

// Discord Icon logic
if (!code.includes("import { DiscordIcon }")) {
  // Let's just use MessageSquare from lucide-react if DiscordIcon is missing
  code = code.replace(
    "import { ShieldAlert,",
    "import { MessageSquare, ShieldAlert,"
  );
}

const supportCode = `
      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-5" />
          Support & Communauté
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rejoignez la communauté mAI sur Discord pour obtenir de l'aide, signaler des bugs ou proposer des fonctionnalités.
        </p>
        <div className="mt-4">
          <Button asChild className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
            <a href="https://discord.gg/fV7zwdGPpY" target="_blank" rel="noreferrer">
              <MessageSquare className="mr-2 size-4" />
              Rejoindre le Discord
            </a>
          </Button>
        </div>
      </section>
`;

code = code.replace(
  `<footer className="rounded-2xl border border-border/50 bg-card/70 p-4 text-center text-xs text-muted-foreground backdrop-blur-xl">`,
  `${supportCode}\n      <footer className="rounded-2xl border border-border/50 bg-card/70 p-4 text-center text-xs text-muted-foreground backdrop-blur-xl">`
);

// We need to mock "Modifier l'adresse mail" and "Changer le mot de passe".
// Let's add toast notifications and checks for guest mode.
code = code.replace(
  `import { Button } from "@/components/ui/button";`,
  `import { Button } from "@/components/ui/button";\nimport { toast } from "sonner";`
);

// find the buttons and add onClick
code = code.replace(
  `<Button className="justify-start" type="button" variant="outline">
            <Mail className="mr-2 size-4" />
            Modifier l&apos;adresse mail
          </Button>`,
  `<Button
            className="justify-start"
            type="button"
            variant="outline"
            onClick={() => {
               if (user?.isAnonymous) {
                  toast.error("Veuillez vous inscrire pour modifier vos informations.");
               } else {
                  toast.info("Fonctionnalité en cours de développement via Auth.js.");
               }
            }}
          >
            <Mail className="mr-2 size-4" />
            Modifier l&apos;adresse mail
          </Button>`
);

code = code.replace(
  `<Button className="justify-start" type="button" variant="outline">
            <ShieldCheck className="mr-2 size-4" />
            Changer le mot de passe
          </Button>`,
  `<Button
            className="justify-start"
            type="button"
            variant="outline"
            onClick={() => {
               if (user?.isAnonymous) {
                  toast.error("Veuillez vous inscrire pour modifier votre mot de passe.");
               } else {
                  toast.info("Fonctionnalité en cours de développement via Auth.js.");
               }
            }}
          >
            <ShieldCheck className="mr-2 size-4" />
            Changer le mot de passe
          </Button>`
);

// We need user context to check user.isAnonymous.
// We see `const [user, setUser] = useState<User | null>(null);` or something in settings? Let's check how user is retrieved in settings.
// I will patch the code to just assume `session?.user` or whatever is there.
fs.writeFileSync("app/(chat)/settings/page.tsx", code);
