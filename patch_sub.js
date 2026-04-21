const fs = require("fs");
const file = "lib/subscription.ts";
let content = fs.readFileSync(file, "utf-8");

// 1. Interface
content = content.replace(
  "newsSearchesPerDay: number;\n  healthRequestsPerMonth: number;",
  "newsSearchesPerDay: number;\n  mealsSearchesPerDay: number;\n  healthRequestsPerMonth: number;"
);

// 2. Free
content = content.replace(
  "newsSearchesPerDay: 3,\n      healthRequestsPerMonth: 5,",
  "newsSearchesPerDay: 3,\n      mealsSearchesPerDay: 3,\n      healthRequestsPerMonth: 5,"
);

// 3. Plus
content = content.replace(
  "newsSearchesPerDay: 5,\n      healthRequestsPerMonth: 10,",
  "newsSearchesPerDay: 5,\n      mealsSearchesPerDay: 5,\n      healthRequestsPerMonth: 10,"
);

// 4. Pro
content = content.replace(
  "newsSearchesPerDay: 10,\n      healthRequestsPerMonth: 15,",
  "newsSearchesPerDay: 10,\n      mealsSearchesPerDay: 10,\n      healthRequestsPerMonth: 15,"
);

// 5. Max
content = content.replace(
  "newsSearchesPerDay: 20,\n      healthRequestsPerMonth: 25,",
  "newsSearchesPerDay: 20,\n      mealsSearchesPerDay: 20,\n      healthRequestsPerMonth: 25,"
);

fs.writeFileSync(file, content, "utf-8");
