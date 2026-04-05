const fs = require("fs");
let code = fs.readFileSync("app/(chat)/library/page.tsx", "utf8");

// The storage limits logic:
// We need to add state or mock for user plan and limit enforcement.
// We'll mock the plan selection and storage limit enforcement.

const mockPlanCode = `
  const planLimits: Record<string, number> = {
    "Free": 20,
    "mAI+": 30,
    "Pro": 50,
    "mAI Max": 100,
  };
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const maxStorage = planLimits[currentPlan];
`;

code = code.replace(
  `const [renameValue, setRenameValue] = useState("");`,
  `const [renameValue, setRenameValue] = useState("");
${mockPlanCode}`
);

// handleImport logic update for limits
code = code.replace(
  `const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }`,
  `const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (assets.length >= maxStorage) {
      alert(\`Limite de stockage atteinte pour le forfait \${currentPlan} (\${maxStorage} fichiers). Veuillez mettre à niveau votre forfait.\`);
      event.target.value = "";
      return;
    }`
);

// Viewing and Downloading files
// In the article map:
const viewerDownloadCode = `
              <div
                className="cursor-pointer group relative overflow-hidden rounded-xl border border-border/50 bg-background"
                onClick={() => {
                  if (asset.url) {
                    // Open in viewer
                    window.open(asset.url, "_blank");
                    // Download local
                    const a = document.createElement('a');
                    a.href = asset.url;
                    a.download = asset.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
              >
                {asset.url ? (
                  <Image
                    alt={asset.name}
                    className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    height={144}
                    src={asset.url}
                    unoptimized={asset.url.startsWith("blob:")}
                    width={320}
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center border-dashed border-border/50 text-xs text-muted-foreground">
                    Cliquer pour télécharger
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-md">Ouvrir & Télécharger</span>
                </div>
              </div>
`;

code = code.replace(
  `{asset.url ? (
                <Image
                  alt={asset.name}
                  className="mb-3 h-36 w-full rounded-xl border border-border/50 object-cover"
                  height={144}
                  src={asset.url}
                  unoptimized={asset.url.startsWith("blob:")}
                  width={320}
                />
              ) : (
                <div className="mb-3 flex h-36 items-center justify-center rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground">
                  Aperçu non disponible (document)
                </div>
              )}`,
  viewerDownloadCode
);

// Add plan selector in header
code = code.replace(
  `<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/50 p-2 backdrop-blur-xl">`,
  `<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/50 p-2 backdrop-blur-xl">
          <select
            className="h-9 rounded-xl border border-border/50 bg-background/70 px-3 text-xs text-amber-500 font-medium"
            onChange={(event) => setCurrentPlan(event.target.value)}
            value={currentPlan}
          >
            {Object.keys(planLimits).map((plan) => (
              <option key={plan} value={plan}>{plan} ({planLimits[plan]} fichiers)</option>
            ))}
          </select>
          <span className="text-xs font-medium mr-2">
            Stockage: {assets.length}/{maxStorage}
          </span>`
);

fs.writeFileSync("app/(chat)/library/page.tsx", code);
