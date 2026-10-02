import { z } from 'zod';

export const updateFormConfigSchema = z.object({
  is_active: z.boolean().optional(),
  is_listed: z.boolean().optional(),
  public_password: z.string().nullable().optional(),
  confirmation_mode: z.enum(['SIMPLE', 'CODE', 'TICKET']).optional(),
  max_submissions: z.number().int().min(0).nullable().optional(),
  folio_strategy: z.enum(['CONSECUTIVE', 'PREFIX_DATE_CONSECUTIVE', 'RANDOM_CHECKSUM']).optional()
}).refine(data => 
  data.is_active !== undefined || 
  data.public_password !== undefined || 
  data.is_listed !== undefined || 
  data.confirmation_mode !== undefined ||
  data.max_submissions !== undefined ||
  data.folio_strategy !== undefined
, {
  message: "At least one field must be provided to update."
});
