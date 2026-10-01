import { z } from 'zod';

export const submitSchema = z.object({
  public_password: z.string().optional(),
  data: z.any().refine(val => val !== undefined, { message: 'Data payload is required' }),
});
