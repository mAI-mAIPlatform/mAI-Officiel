const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.log('No POSTGRES_URL found');
  process.exit(0);
}

const client = postgres(connectionString);
client`SELECT 1`.then(res => {
  console.log('DB connected', res);
  process.exit(0);
}).catch(err => {
  console.log('DB failed', err.message);
  process.exit(0);
});
