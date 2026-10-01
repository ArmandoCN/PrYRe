const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.eventRegistration.create({
      data: {
        folio: "TEST1234",
        activity: "HORA_DEL_CUENTO",
        activity_date: new Date().toISOString(),
        participant_name: "Test",
        participant_birthdate: new Date().toISOString(),
        participant_gender: "OTRO",
        participant_email: "test@example.com",
        participant_phone: "1234567890",
        participant_neighborhood: "Test",
        participant_occupation: "ESTUDIANTE",
        participant_education: "PRIMARIA",
        needs_disability_support: false,
        has_library_loan_record: false
      }
    });
    console.log("SUCCESS:", res.id);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
