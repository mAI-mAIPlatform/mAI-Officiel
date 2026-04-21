const fs = require('fs');
let content = fs.readFileSync('lib/usage-limits.ts', 'utf8');
content = content.replace(
  /export type UsageFeature =([^;]+);/,
  `export type UsageFeature =
  | "news"
  | "health"
  | "meals"
  | "websearch"
  | "files"
  | "studio"
  | "tier1"
  | "tier2"
  | "tier3";`
);
fs.writeFileSync('lib/usage-limits.ts', content);
