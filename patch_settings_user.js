const fs = require("fs");
let code = fs.readFileSync("app/(chat)/settings/page.tsx", "utf8");

// The file uses useSession, so we can extract user via session.data?.user
code = code.replace(
  "const { data: session } = useSession();", // just in case it's there
  ""
);

code = code.replace(
  "export default function SettingsPage() {",
  "export default function SettingsPage() {\n  const { data: session } = useSession();\n  const user = session?.user as any;"
);

fs.writeFileSync("app/(chat)/settings/page.tsx", code);
