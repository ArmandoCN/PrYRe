import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.eventRegistration.create({
      data: {
        activity: 'TALLER',
        activity_date: '2024-01-01',
        participant_name: 'Test',
        participant_birthdate: '2000-01-01',
        participant_gender: 'H',
        participant_occupation: 'ESTUDIANTE',
        participant_education: 'PRIMARIA',
        needs_disability_support: false,
        has_library_loan_record: false,
        accepts_image_usage: true
      } as any
    });
    console.log("Success");
  } catch (e: any) {
    console.log("Prisma Error:", e.message);
  }
}
main();
