import { z } from 'zod';

export const createCustomViewSchema = z.object({
  name: z.string().min(1),
  form_identifier: z.string().min(1),
  columns: z.any(),
  filters: z.any()
});
