const fs = require("fs");

let loginCode = fs.readFileSync("app/(auth)/login/page.tsx", "utf8");
loginCode = loginCode.replace(
  `      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>`,
  `      <h1 className="text-2xl font-semibold tracking-tight">Content de vous revoir</h1>
      <p className="text-sm text-muted-foreground">
        Connectez-vous à votre compte pour continuer
      </p>`
);

loginCode = loginCode.replace(
  `<SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"No account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            Sign up
          </Link>`,
  `<SubmitButton isSuccessful={isSuccessful}>Se connecter</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Pas encore de compte ? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            S'inscrire
          </Link>`
);

// We should also patch AuthForm default texts if there are any inside components/chat/auth-form.tsx, but the form usually doesn't have hardcoded text besides inputs, let's check it later.
fs.writeFileSync("app/(auth)/login/page.tsx", loginCode);

let registerCode = fs.readFileSync("app/(auth)/register/page.tsx", "utf8");
registerCode = registerCode.replace(
  `      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email below to create your account
      </p>`,
  `      <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="text-sm text-muted-foreground">
        Entrez votre adresse e-mail ci-dessous pour créer votre compte
      </p>`
);

registerCode = registerCode.replace(
  `<SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Already have an account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Sign in
          </Link>`,
  `<SubmitButton isSuccessful={isSuccessful}>S'inscrire</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Déjà un compte ? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Se connecter
          </Link>`
);
fs.writeFileSync("app/(auth)/register/page.tsx", registerCode);

let layoutCode = fs.readFileSync("app/(auth)/layout.tsx", "utf8");
layoutCode = layoutCode.replace(
  `        <div className="flex items-center gap-1.5 pt-8 text-[13px] text-muted-foreground/50">
          Powered by
          <VercelIcon size={14} />
          <span className="font-medium text-muted-foreground">AI Gateway</span>
        </div>`,
  ""
);

// Also remove the "Back" to "Retour"
layoutCode = layoutCode.replace(
  `<ArrowLeftIcon className="size-3.5" />
          Back`,
  `<ArrowLeftIcon className="size-3.5" />
          Retour`
);
fs.writeFileSync("app/(auth)/layout.tsx", layoutCode);
