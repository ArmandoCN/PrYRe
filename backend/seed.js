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

  await prisma.formConfig.upsert({
    where: { form_identifier: 'PrepaStase' },
    update: {},
    create: {
      form_identifier: 'PrepaStase',
      is_active: true,
      is_listed: true,
      folio_strategy: 'CONSECUTIVE',
      folio_prefix: 'PREP'
    },
  });
  console.log('Formulario PrepaStase creado y activado.');

  await prisma.formConfig.upsert({
    where: { form_identifier: 'ActivityCatalog' },
    update: { is_listed: false },
    create: {
      form_identifier: 'ActivityCatalog',
      is_active: true,
      is_listed: false,
      folio_strategy: 'CONSECUTIVE',
      folio_prefix: 'ACT'
    },
  });
  console.log('Formulario ActivityCatalog creado y activado.');

  await prisma.formConfig.upsert({
    where: { form_identifier: 'ActivityParticipant' },
    update: {},
    create: {
      form_identifier: 'ActivityParticipant',
      is_active: true,
      is_listed: true,
      folio_strategy: 'CONSECUTIVE',
      folio_prefix: 'PART'
    },
  });
  console.log('Formulario ActivityParticipant creado y activado.');

  // Seed para el evento registrado ("Taller Consejo Tecnico") dejándolo a 1 registro de llenarse
  let activity = await prisma.activityCatalog.findFirst({
    where: {
      activity_name: { contains: 'Taller Consejo Tecnico', mode: 'insensitive' },
      deleted_at: null,
    },
    orderBy: { created_at: 'desc' },
  });

  if (!activity) {
    activity = await prisma.activityCatalog.create({
      data: {
        folio: 'ACT-0001',
        activity_name: 'Taller Consejo Tecnico',
        activity_date: new Date('2026-10-30T12:00:00.000Z'),
        total_capacity: 25,
        reserved_capacity: 10,
        real_capacity: 15,
      },
    });
  }

  const targetParticipantsCount = Math.max(0, activity.real_capacity - 1); // 14 de 15 (falta 1 para llenarse)
  const existingParticipantsCount = await prisma.activityParticipant.count({
    where: { activity_id: activity.id, deleted_at: null },
  });

  if (existingParticipantsCount < targetParticipantsCount) {
    const sampleParticipants = [
      {
        participant_name: 'Mateo Hernández López',
        birthdate: new Date('2015-03-14T12:00:00.000Z'), // 14/03/15
        gender: 'H',
        needs_special_support: false,
        tutor_name: 'Laura López García',
        tutor_phone: '6671234501',
        secondary_phone: '6679876501',
        notes: 'Asiste puntualmente. Sin alergias reportadas.',
      },
      {
        participant_name: 'Sofía Ramírez Castro',
        birthdate: new Date('2016-07-22T12:00:00.000Z'), // 22/07/16
        gender: 'M',
        needs_special_support: true,
        tutor_name: 'Carlos Ramírez Vega',
        tutor_phone: '6672345602',
        secondary_phone: '6678765402',
        notes: 'Requiere asiento en primera fila por debilidad visual leve.',
      },
      {
        participant_name: 'Diego Morales Bojórquez',
        birthdate: new Date('2014-11-05T12:00:00.000Z'), // 05/11/14
        gender: 'H',
        needs_special_support: false,
        tutor_name: 'Ana Bojórquez Félix',
        tutor_phone: '6673456703',
        secondary_phone: '6677654303',
        notes: 'Autorizado para retirarse únicamente con su madre.',
      },
      {
        participant_name: 'Valentina Gastélum Ochoa',
        birthdate: new Date('2015-09-18T12:00:00.000Z'), // 18/09/15
        gender: 'M',
        needs_special_support: false,
        tutor_name: 'Fernando Gastélum Ruiz',
        tutor_phone: '6674567804',
        secondary_phone: '6676543204',
        notes: 'Trae su propio material de lectura y dibujo.',
      },
      {
        participant_name: 'Sebastián Valenzuela Ríos',
        birthdate: new Date('2016-01-29T12:00:00.000Z'), // 29/01/16
        gender: 'H',
        needs_special_support: true,
        tutor_name: 'Martha Ríos Beltrán',
        tutor_phone: '6675678905',
        secondary_phone: '6675432105',
        notes: 'Condición de hipoacusia leve; hablarle de frente con claridad.',
      },
      {
        participant_name: 'Camila Camacho Ibarra',
        birthdate: new Date('2015-05-11T12:00:00.000Z'), // 11/05/15
        gender: 'M',
        needs_special_support: false,
        tutor_name: 'Jorge Camacho Leyva',
        tutor_phone: '6676789006',
        secondary_phone: '6674321006',
        notes: 'Alergia leve al polvo; mantener área ventilada.',
      },
      {
        participant_name: 'Leonardo Mendoza Quintero',
        birthdate: new Date('2014-08-03T12:00:00.000Z'), // 03/08/14
        gender: 'H',
        needs_special_support: false,
        tutor_name: 'Patricia Quintero Soto',
        tutor_phone: '6677890107',
        secondary_phone: '6673210907',
        notes: 'Participante frecuente de los viernes de Consejo Técnico.',
      },
      {
        participant_name: 'Regina Carrillo Meza',
        birthdate: new Date('2016-12-19T12:00:00.000Z'), // 19/12/16
        gender: 'M',
        needs_special_support: false,
        tutor_name: 'Héctor Carrillo Lugo',
        tutor_phone: '6678901208',
        secondary_phone: '6672109808',
        notes: 'Su abuela materna también está autorizada para recogerla.',
      },
      {
        participant_name: 'Emiliano Angulo Verdugo',
        birthdate: new Date('2015-02-08T12:00:00.000Z'), // 08/02/15
        gender: 'H',
        needs_special_support: false,
        tutor_name: 'Silvia Verdugo Cárdenas',
        tutor_phone: '6679012309',
        secondary_phone: '6671098709',
        notes: 'Le gustan las actividades de papiroflexia y cuentos ilustrados.',
      },
      {
        participant_name: 'Renata Osuna Peñuelas',
        birthdate: new Date('2016-06-25T12:00:00.000Z'), // 25/06/16
        gender: 'M',
        needs_special_support: true,
        tutor_name: 'Ricardo Osuna Armenta',
        tutor_phone: '6671122310',
        secondary_phone: '6679988710',
        notes: 'Requiere apoyo de movilidad para subir escalones.',
      },
      {
        participant_name: 'Santiago Lizárraga Félix',
        birthdate: new Date('2014-10-12T12:00:00.000Z'), // 12/10/14
        gender: 'H',
        needs_special_support: false,
        tutor_name: 'Gabriela Félix Montoya',
        tutor_phone: '6672233411',
        secondary_phone: '6678877611',
        notes: 'Hermano mayor de Victoria Lizárraga; asisten juntos.',
      },
      {
        participant_name: 'Victoria Lizárraga Félix',
        birthdate: new Date('2016-04-30T12:00:00.000Z'), // 30/04/16
        gender: 'M',
        needs_special_support: false,
        tutor_name: 'Gabriela Félix Montoya',
        tutor_phone: '6672233411',
        secondary_phone: '6678877611',
        notes: 'Hermana menor de Santiago Lizárraga; mismo contacto de tutor.',
      },
      {
        participant_name: 'Roberto Cervantes Lugo',
        birthdate: new Date('1994-09-15T12:00:00.000Z'), // 15/09/94
        gender: 'H',
        needs_special_support: false,
        tutor_name: null,
        tutor_phone: '6673344513',
        secondary_phone: '6677766513',
        notes: 'Participante adulto (docente en formación observador del taller).',
      },
      {
        participant_name: 'Mariana Espinoza Duarte',
        birthdate: new Date('2015-11-27T12:00:00.000Z'), // 27/11/15
        gender: 'M',
        needs_special_support: false,
        tutor_name: 'Claudia Duarte Salazar',
        tutor_phone: '6674455614',
        secondary_phone: '6676655414',
        notes: 'Sin observaciones médicas. Confirmada asistencia completa.',
      },
    ];

    const d = new Date(activity.activity_date);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(d.getUTCFullYear()).slice(-2);
    const activityLabel = `${activity.activity_name} (${dd}/${mm}/${yy})`;

    let globalCount = await prisma.activityParticipant.count();
    const toCreate = targetParticipantsCount - existingParticipantsCount;

    for (let i = 0; i < toCreate; i++) {
      globalCount += 1;
      const sample = sampleParticipants[(existingParticipantsCount + i) % sampleParticipants.length];
      const folio = `PART-${String(globalCount).padStart(4, '0')}`;

      await prisma.activityParticipant.create({
        data: {
          folio,
          activity_id: activity.id,
          activity_name: activityLabel,
          participant_name: sample.participant_name,
          birthdate: sample.birthdate,
          gender: sample.gender,
          needs_special_support: sample.needs_special_support,
          tutor_name: sample.tutor_name,
          tutor_phone: sample.tutor_phone,
          secondary_phone: sample.secondary_phone,
          notes: sample.notes,
        },
      });
    }

    console.log(
      `Seed Taller Consejo Tecnico: se insertaron ${toCreate} participantes (${targetParticipantsCount}/${activity.real_capacity} inscritos, queda 1 lugar disponible).`
    );
  } else {
    console.log(
      `Seed Taller Consejo Tecnico: ya cuenta con ${existingParticipantsCount}/${activity.real_capacity} participantes.`
    );
  }
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
