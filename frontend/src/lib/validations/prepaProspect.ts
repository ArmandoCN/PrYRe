import * as z from 'zod';

export const prepaProspectSchema = z.object({
  full_name: z.string().min(3, "El nombre completo es obligatorio"),
  birthdate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  neighborhood: z.string().min(1, "La colonia es obligatoria"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").max(20, "Número demasiado largo"),
  email: z.string().email("Correo inválido").optional().or(z.literal('')),
  
  tutor_name: z.string().optional(),
  tutor_phone: z.string().optional(),
  
  last_grade: z.string().min(1, "Especifica el último grado de estudios"),
  last_school: z.string().min(1, "Especifica la institución de los últimos estudios"),
  
  modality: z.enum(['ESCOLARIZADA', 'ABIERTA'], {
    required_error: "Debes seleccionar una modalidad",
  }),
  shift: z.enum(['MATUTINO', 'VESPERTINO', 'SABATINO'], {
    required_error: "Debes seleccionar un turno",
  }),
  
  contact_methods: z.array(z.string()).min(1, "Selecciona al menos un medio de contacto"),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Calculamos la edad
  const birthDateObj = new Date(data.birthdate);
  // Prevent invalid dates from crashing the age check
  if (isNaN(birthDateObj.getTime())) return;

  const ageDifMs = Date.now() - birthDateObj.getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  // Si es menor de 18, exigimos campos de tutor
  if (age < 18) {
    if (!data.tutor_name || data.tutor_name.trim().length === 0) {
      ctx.addIssue({
        path: ['tutor_name'],
        code: z.ZodIssueCode.custom,
        message: "Obligatorio para menores de edad",
      });
    }
    if (!data.tutor_phone || data.tutor_phone.trim().length < 10) {
      ctx.addIssue({
        path: ['tutor_phone'],
        code: z.ZodIssueCode.custom,
        message: "Teléfono (mín. 10 dígitos) obligatorio para menores",
      });
    }
  }
});

export type PrepaProspectData = z.infer<typeof prepaProspectSchema>;
