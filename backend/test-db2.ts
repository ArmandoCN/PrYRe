import { db } from './src/prisma/db.js';

async function main() {
  console.log("Keys of db:", Object.keys(db));
  if (db.orm) {
    console.log("Keys of db.orm:", Object.keys(db.orm));
  }
  process.exit(0);
}

main().catch(console.error);
