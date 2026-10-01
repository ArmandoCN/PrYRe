import { z } from 'zod';

export const updateFormConfigSchema = z.object({
  is_active: z.boolean().optional(),
  is_listed: z.boolean().optional(),
  public_password: z.string().nullable().optional(),
  confirmation_mode: z.enum(['SIMPLE', 'CODE', 'TICKET']).optional()
}).refine(data => data.is_active !== undefined || data.public_password !== undefined || data.is_listed !== undefined || data.confirmation_mode !== undefined, {
  message: "At least one field must be provided to update."
});
