import { z } from 'zod';

export const eventRegistrationSchema = z.object({
  // Información General
  activity: z.enum(['HORA_DEL_CUENTO', 'CIRCULO_DE_LECTURA', 'TALLER'], { required_error: 'La actividad es obligatoria' }),
  activity_date: z.string({ required_error: 'La fecha es obligatoria' }).min(1, 'La fecha es obligatoria'),

  // Información del Participante
  participant_name: z.string().min(1, 'El nombre es obligatorio'),
  participant_birthdate: z.string({ required_error: 'La fecha de nacimiento es obligatoria' }).min(1, 'La fecha de nacimiento es obligatoria'),
  participant_gender: z.enum(['H', 'M'], { required_error: 'El género es obligatorio' }),
  participant_email: z.string().email('Correo inválido').optional().or(z.literal('')),
  participant_phone: z.string().optional(),
  participant_neighborhood: z.string().optional(),
  participant_occupation: z.enum(['HOGAR', 'ESTUDIANTE', 'TRABAJADOR', 'JUBILADO', 'DESOCUPADO'], { required_error: 'Ocupación obligatoria' }),
  participant_education: z.enum(['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'BACHILLERATO', 'LICENCIATURA', 'POSGRADO'], { required_error: 'Nivel de estudios obligatorio' }),
  needs_disability_support: z.boolean().default(false),
  has_library_loan_record: z.boolean().default(false),

  // Información de Contacto
  contact1_name: z.string().optional(),
  contact1_email: z.string().email('Correo inválido').optional().or(z.literal('')),
  contact1_phone: z.string().optional(),
  contact1_relation: z.enum(['PADRE', 'MADRE', 'TUTOR', 'OTRO_FAMILIAR', 'OTRO']).optional(),

  // Información de Segundo Contacto
  contact2_name: z.string().optional(),
  contact2_email: z.string().email('Correo inválido').optional().or(z.literal('')),
  contact2_phone: z.string().optional(),
  contact2_relation: z.enum(['PADRE', 'MADRE', 'TUTOR', 'OTRO_FAMILIAR', 'OTRO']).optional(),

  // Autorización e Indicaciones
  accepts_image_usage: z.boolean().default(false)
});

export type EventRegistrationFormValues = z.infer<typeof eventRegistrationSchema>;
