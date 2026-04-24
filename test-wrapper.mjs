import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const file = 'tests/unit/notifications.test.ts';
const content = readFileSync(file, 'utf-8');
const newContent = content.replace(/@\/lib/g, '../../lib');
// Replace extensionless imports with .ts
const finalContent = newContent.replace(/'\.\.\/\.\.\/lib\/notifications'/g, "'../../lib/notifications.ts'");
writeFileSync('tests/unit/notifications.temp.test.ts', finalContent);

const result = spawnSync('node', ['--experimental-strip-types', '--test', 'tests/unit/notifications.temp.test.ts'], { stdio: 'inherit' });
process.exit(result.status);
