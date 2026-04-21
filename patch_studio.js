const fs = require('fs');
let content = fs.readFileSync('app/(chat)/studio/page.tsx', 'utf8');

if (!content.includes('useSubscriptionPlan')) {
// Imports
content = content.replace(
  /import { affordableImageModels } from "@\/lib\/ai\/affordable-models";/,
  `import { affordableImageModels } from "@/lib/ai/affordable-models";\nimport { useSubscriptionPlan } from "@/hooks/use-subscription-plan";\nimport { getUsageCount, canConsumeUsage, consumeUsage } from "@/lib/usage-limits";`
);

// Add hooks
content = content.replace(
  /export default function StudioPage\(\) \{/,
  `export default function StudioPage() {
  const { currentPlanDefinition } = useSubscriptionPlan();`
);

// Update logic in runStudio
content = content.replace(
  /    setIsLoading\(true\);\n    setError\(""\);\n    setResultImage\(""\);/,
  `    setIsLoading(true);
    setError("");
    setResultImage("");

    if (!canConsumeUsage("studio", "day", currentPlanDefinition.limits.studioImagesPerDay)) {
      setError("Limite journalière de studio atteinte pour votre forfait.");
      setIsLoading(false);
      return;
    }`
);

// Handle Horde API changes
content = content.replace(
  /      setResultProvider\(payload\.provider \?\? "provider inconnu"\);\n\n      if \(payload\.type === "image"\) \{/,
  `      setResultProvider(payload.provider ?? "provider inconnu");

      if (payload.pending && payload.id) {
        // AI Horde polling logic
        consumeUsage("studio", "day");

        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          if (attempts > 120) {
            clearInterval(poll);
            setError("Génération longue, veuillez réessayer plus tard.");
            setIsLoading(false);
            return;
          }

          try {
            const statusRes = await fetch(\`/api/studio/result/\${payload.id}\`);
            if (!statusRes.ok) {
              throw new Error("Erreur lors de la vérification du statut");
            }
            const statusPayload = await statusRes.json();

            if (statusPayload.finished) {
              clearInterval(poll);
              if (statusPayload.error) {
                setError(statusPayload.error);
              } else if (statusPayload.imageUrl) {
                setResultImage(statusPayload.imageUrl);
              }
              setIsLoading(false);
            }
          } catch (pollError) {
             console.error(pollError);
          }
        }, 5000);
        return; // loading continues until interval finishes
      } else {
        consumeUsage("studio", "day");
      }

      if (payload.type === "image") {`
);

// Button disabled logic
content = content.replace(
  /disabled={isLoading}/,
  `disabled={isLoading || !canConsumeUsage("studio", "day", currentPlanDefinition?.limits?.studioImagesPerDay || 0)}`
);

// Add usage display
content = content.replace(
  /<p className="text-sm text-black\/70">/,
  `<p className="text-sm text-black/70">`
);

// Before <section className="grid...
content = content.replace(
  /<section className="grid gap-4/,
  `<div className="text-xs text-black/60 mb-2">
        Utilisation quotidienne : {getUsageCount("studio", "day")} / {currentPlanDefinition?.limits?.studioImagesPerDay || 0}
      </div>
      <section className="grid gap-4`
);

fs.writeFileSync('app/(chat)/studio/page.tsx', content);
}
