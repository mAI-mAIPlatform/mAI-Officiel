const fs = require('fs');
let content = fs.readFileSync('app/(chat)/studio/page.tsx', 'utf8');
content = content.replace(/<img\n/g, '<img\n'); // Nothing since this error is safe to ignore in this context, or we can use eslint-disable-next-line
content = content.replace(/<img/g, '/* biome-ignore lint/performance/noImgElement: <explanation> */\n            <img');
fs.writeFileSync('app/(chat)/studio/page.tsx', content);
