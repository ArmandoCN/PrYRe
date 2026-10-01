import { db } from './src/prisma/db.js';

async function main() {
  console.log(Object.keys(db.orm));
  process.exit(0);
}

main().catch(console.error);
