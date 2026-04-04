const fs = require('fs');
const file = 'lib/db/queries.ts';
let content = fs.readFileSync(file, 'utf8');

// The type checking error: Generic type 'Pick' requires 2 type argument(s).
// Looking at the error it seems updateAgent has been modified incorrectly or has a malformed type.
const brokenType = `  data: Partial<
    Pick<
      Agent,
      Project,
      "name" | "description" | "systemPrompt" | "memory" | "files" | "image"
    >
  >`;

const fixedType = `  data: Partial<Agent>`;

if (content.includes('Pick<')) {
    // we need to fix the updateAgent signature
    content = content.replace(/data:\s*Partial<\s*Pick<\s*Agent,\s*Project,[\s\S]*?>\s*>/g, 'data: Partial<Agent>');
    content = content.replace(/data:\s*Partial<\s*Pick<\s*Agent,\s*"name"[\s\S]*?>\s*>/g, 'data: Partial<Agent>');
    fs.writeFileSync(file, content);
    console.log('Fixed queries types.');
} else {
    console.log('Could not find Pick<Agent');
}
