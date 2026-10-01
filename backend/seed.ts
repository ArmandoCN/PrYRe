import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@admin.com';
  const passwordHash = await bcrypt.hash('admin123', 10);
  const id = crypto.randomUUID();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id,
      email: adminEmail,
      password_hash: passwordHash,
      role: 'ADMIN'
    }
  });

  await prisma.formConfig.upsert({
    where: { form_identifier: 'EventRegistration' },
    update: { is_active: true },
    create: {
      form_identifier: 'EventRegistration',
      is_active: true
    }
  });

  console.log('Admin user seed completed. Email: admin@admin.com, Password: admin123');
  process.exit(0);
}

main().catch(console.error);
