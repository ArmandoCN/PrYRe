import * as z from 'zod';
import { isValidDateDDMMYY } from '../locale';

export const activityParticipantSchema = z.object({
  activity_id: z.string().min(1, "Debes seleccionar una actividad"),
  participant_name: z.string().min(3, "El nombre es obligatorio"),
  birthdate: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria (DD/MM/AA)")
    .refine((val) => isValidDateDDMMYY(val), {
      message: "Fecha inválida. Usa el formato DD/MM/AA",
    }),
  gender: z.enum(['H', 'M'], {
    required_error: "Debes seleccionar el género",
  }),
  needs_special_support: z.boolean(),
  tutor_name: z.string().optional(),
  tutor_phone: z.string().min(10, "El teléfono es obligatorio (mínimo 10 dígitos)").max(20, "Número demasiado largo"),
  secondary_phone: z.string().max(20, "Número demasiado largo").optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type ActivityParticipantData = z.infer<typeof activityParticipantSchema>;
