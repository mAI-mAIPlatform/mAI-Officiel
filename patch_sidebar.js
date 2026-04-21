const fs = require('fs');
let content = fs.readFileSync('components/chat/app-sidebar.tsx', 'utf8');

if (!content.includes('ImagePlusIcon')) {
  content = content.replace(
    /import {([^}]*)PenSquareIcon([^}]*)} from "lucide-react";/,
    `import {$1PenSquareIcon, ImagePlusIcon$2} from "lucide-react";`
  );
  if (!content.includes('ImagePlusIcon')) {
     content = content.replace(
        /import {([^}]*)PenSquareIcon([^}]*)} from "\.\/icons";/,
        `import {$1PenSquareIcon, ImagePlusIcon$2} from "./icons";`
     );
  }
}

if (!content.includes('href: "/studio"')) {
  content = content.replace(
    /const QUICK_LINKS = \[\s*\{ href: "\/", key: "discussion", icon: PenSquareIcon \},/,
    `const QUICK_LINKS = [
  { href: "/", key: "discussion", icon: PenSquareIcon },
  { href: "/studio", key: "studio", icon: ImagePlusIcon },`
  );
}

const langs = ['en', 'es', 'fr'];
for (const lang of langs) {
  const langRegex = new RegExp(`(${lang}: \\{[\\s\\S]*?)projects: "(.*?)",`, 'g');
  const match = content.match(langRegex);
  if (match && !match[0].includes('studio:')) {
    const studioText = lang === 'fr' ? 'Studio' : lang === 'es' ? 'Estudio' : 'Studio';
    content = content.replace(
      langRegex,
      `$1studio: "${studioText}",\n    projects: "$2",`
    );
  }
}

fs.writeFileSync('components/chat/app-sidebar.tsx', content);
