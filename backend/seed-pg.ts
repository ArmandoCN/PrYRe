import { Client } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  const adminEmail = 'admin@admin.com';
  const passwordHash = await bcrypt.hash('admin123', 10);
  const id = crypto.randomUUID();
  const configId = crypto.randomUUID();

  // Insert Admin
  await client.query(`
    INSERT INTO "public"."User" (id, email, password_hash, role, created_at, updated_at)
    VALUES ($1, $2, $3, 'ADMIN', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
  `, [id, adminEmail, passwordHash]);

  // Make EventRegistration form active by default
  await client.query(`
    INSERT INTO "public"."FormConfig" (id, form_identifier, is_active, created_at, updated_at)
    VALUES ($1, 'EventRegistration', true, NOW(), NOW())
    ON CONFLICT (form_identifier) DO UPDATE SET is_active = true, updated_at = NOW();
  `, [configId]);

  console.log('Admin user and form config seed completed via pg directly.');
  await client.end();
}

main().catch(console.error);
