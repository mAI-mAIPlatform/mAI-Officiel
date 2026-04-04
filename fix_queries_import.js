const fs = require('fs');
const file = 'lib/db/queries.ts';
let content = fs.readFileSync(file, 'utf8');

// The type checking error: Cannot find name 'Project'.
// We need to import Project from schema.ts
if (!content.includes('Project,')) {
    content = content.replace('type Agent,', 'type Agent,\n  type Project,');
    fs.writeFileSync(file, content);
    console.log('Fixed imports in queries.ts');
} else {
    console.log('Project is already imported or another issue exists');
}
