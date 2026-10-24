import { z } from 'zod';

export const activityCatalogBackendSchema = z.object({
  activity_name: z.string().trim().min(2, "El nombre de la actividad es obligatorio"),
  activity_date: z.union([
    z.date(),
    z.string().datetime({ message: "Fecha de actividad inválida (debe ser ISO-8601)" }).or(z.string().min(1))
  ]),
  total_capacity: z.coerce.number().int().min(1, "El cupo total debe ser al menos 1"),
  reserved_capacity: z.coerce.number().int().min(0, "El cupo reservado no puede ser negativo").default(0),
  real_capacity: z.coerce.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.reserved_capacity > data.total_capacity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El cupo reservado no puede superar al cupo total",
      path: ["reserved_capacity"],
    });
  }
});

export type ActivityCatalogBackendInput = z.infer<typeof activityCatalogBackendSchema>;
