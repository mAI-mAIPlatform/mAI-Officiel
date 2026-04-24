const { readFileSync } = require('fs');
const content = readFileSync('app/(chat)/settings/page.tsx', 'utf-8');
const lines = content.split('\n');
let i = 0;
while (i < lines.length) {
  if (lines[i].includes('profile-logo-input')) {
    console.log(`Found around line ${i}`);
  }
  i++;
}
