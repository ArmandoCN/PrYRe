import { z } from 'zod';

export const eventRegistrationSchema = z.object({
  // Información General
  activity: z.enum(['HORA_DEL_CUENTO', 'CIRCULO_DE_LECTURA', 'TALLER']),
  activity_date: z.string().datetime(),

  // Información del Participante
  participant_name: z.string().min(1, "El nombre es requerido"),
  participant_birthdate: z.string().datetime(),
  participant_gender: z.enum(['H', 'M']),
  participant_email: z.union([z.literal(''), z.string().email("Correo inválido")]).optional(),
  participant_phone: z.union([z.literal(''), z.string().regex(/^[0-9]{10}$/, "Debe contener exactamente 10 dígitos numéricos")]).optional(),
  participant_neighborhood: z.string().optional(),
  participant_occupation: z.enum(['HOGAR', 'ESTUDIANTE', 'TRABAJADOR', 'JUBILADO', 'DESOCUPADO']),
  participant_education: z.enum(['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA', 'BACHILLERATO', 'LICENCIATURA', 'POSGRADO']),
  needs_disability_support: z.boolean(),
  has_library_loan_record: z.boolean(),

  // Información de Contacto
  contact1_name: z.string().optional(),
  contact1_email: z.union([z.literal(''), z.string().email("Correo inválido")]).optional(),
  contact1_phone: z.union([z.literal(''), z.string().regex(/^[0-9]{10}$/, "Debe contener exactamente 10 dígitos numéricos")]).optional(),
  contact1_relation: z.enum(['PADRE', 'MADRE', 'TUTOR', 'OTRO_FAMILIAR', 'OTRO']).optional(),

  // Información de Segundo Contacto
  contact2_name: z.string().optional(),
  contact2_email: z.union([z.literal(''), z.string().email("Correo inválido")]).optional(),
  contact2_phone: z.union([z.literal(''), z.string().regex(/^[0-9]{10}$/, "Debe contener exactamente 10 dígitos numéricos")]).optional(),
  contact2_relation: z.enum(['PADRE', 'MADRE', 'TUTOR', 'OTRO_FAMILIAR', 'OTRO']).optional(),

  // Autorización e Indicaciones
  accepts_image_usage: z.boolean()
});
