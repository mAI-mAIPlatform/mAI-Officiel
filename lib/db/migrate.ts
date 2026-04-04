import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function run() {
  if (!process.env.POSTGRES_URL) {
    console.warn("POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "lib/db/migrations" });

  console.log("Migrations completed successfully");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
