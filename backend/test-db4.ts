import { db } from './src/prisma/db.js';

async function main() {
  console.log("Type of db.sql:", typeof db.sql);
  console.log("Value of db.sql:", db.sql);
  process.exit(0);
}

main().catch(console.error);
