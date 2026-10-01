import { db } from './src/prisma/db.js';

async function main() {
  const users = await db.sql`SELECT * FROM "User"`;
  console.log(users);
  process.exit(0);
}

main().catch(console.error);
