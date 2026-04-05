const fs = require("fs");
let code = fs.readFileSync("components/chat/app-sidebar.tsx", "utf8");

// The original code was mapping over an array with items that had optional `restricted` and `beta` properties.
// Since we removed most of the items, we need to make sure the remaining items type properly.

code = code.replace("{item.restricted ? (", "{(item as any).restricted ? (");

code = code.replace(": item.beta ? (", ": (item as any).beta ? (");

fs.writeFileSync("components/chat/app-sidebar.tsx", code);
