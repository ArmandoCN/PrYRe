const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: 'SUPERADMIN' },
    create: {
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
    },
  });

  // Migración automática: Convertir todos los ADMIN actuales a SUPERADMIN
  // para que los usuarios no pierdan el acceso maestro al aplicar este parche.
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'SUPERADMIN' }
  });

  await prisma.formConfig.upsert({
    where: { form_identifier: 'EventRegistration' },
    update: {},
    create: {
      form_identifier: 'EventRegistration',
      is_active: true,
      is_listed: true,
    },
  });

  console.log('Seed exitoso: admin@example.com / admin123');
  console.log('Formulario EventRegistration creado y activado.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
