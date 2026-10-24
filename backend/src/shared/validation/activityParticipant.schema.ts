import { z } from 'zod';

export const activityParticipantBackendSchema = z.object({
  activity_id: z.string().uuid("ID de actividad inválido"),
  activity_name: z.string().trim().min(1).optional(),
  participant_name: z.string().trim().min(3, "El nombre del participante es obligatorio"),
  birthdate: z.union([
    z.date(),
    z.string().datetime({ message: "Fecha de nacimiento inválida" }).or(z.string().min(1))
  ]),
  gender: z.enum(['H', 'M']),
  needs_special_support: z.boolean(),
  tutor_name: z.string().trim().nullable().optional(),
  tutor_phone: z.string().trim().min(10, "El teléfono del tutor es obligatorio (mínimo 10 dígitos)").max(20),
  secondary_phone: z.string().trim().max(20, "Número demasiado largo").nullable().optional().or(z.literal('')),
  notes: z.string().trim().nullable().optional().or(z.literal('')),
});

export type ActivityParticipantBackendInput = z.infer<typeof activityParticipantBackendSchema>;
