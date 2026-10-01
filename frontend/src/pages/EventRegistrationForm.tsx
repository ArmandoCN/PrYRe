import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import { eventRegistrationSchema, type EventRegistrationFormValues } from '../lib/validations/eventRegistration';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export function EventRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // States for form configuration and password protection
  const [configLoading, setConfigLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordProvided, setPasswordProvided] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmationMode, setConfirmationMode] = useState<'SIMPLE' | 'CODE' | 'TICKET'>('SIMPLE');

  // Novedades: Reservas y Folios Reales
  const [reservationToken, setReservationToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [finalFolio, setFinalFolio] = useState<string | null>(null);
  const [hasLimit, setHasLimit] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/forms/EventRegistration/config');
        if (response.data.success) {
          setIsActive(response.data.data.is_active);
          setRequiresPassword(response.data.data.requires_password);
          setConfirmationMode(response.data.data.confirmation_mode || 'SIMPLE');
        }
      } catch (err) {
        setIsActive(false); // Default to closed on error
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Sistema de Reserva de Cupo (Dispara cuando el form está abierto y desbloqueado)
  useEffect(() => {
    if (configLoading || !isActive || (requiresPassword && !passwordProvided)) return;
    if (isSoldOut || reservationToken) return; // Prevent double firing

    const reserveSpot = async () => {
      try {
        const response = await axios.post('/api/forms/EventRegistration/reserve');
        if (response.data.success) {
          setReservationToken(response.data.data.reservation_token);
          setExpiresAt(new Date(response.data.data.expires_at));
          setHasLimit(response.data.data.has_limit);
        }
      } catch (err: any) {
        if (err.response?.data?.error?.code === 'LIMIT_REACHED') {
          setIsSoldOut(true);
        }
      }
    };

    reserveSpot();
  }, [configLoading, isActive, requiresPassword, passwordProvided, isSoldOut, reservationToken]);

  const form = useForm<any>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues: {
      activity: undefined,
      activity_date: '',
      participant_name: '',
      participant_birthdate: '',
      participant_gender: undefined,
      participant_email: '',
      participant_phone: '',
      participant_neighborhood: '',
      participant_occupation: undefined,
      participant_education: undefined,
      needs_disability_support: false,
      has_library_loan_record: false,
      contact1_name: '',
      contact1_email: '',
      contact1_phone: '',
      contact1_relation: undefined,
      contact2_name: '',
      contact2_email: '',
      contact2_phone: '',
      contact2_relation: undefined,
      accepts_image_usage: false,
    } as any,
  });

  async function onSubmit(data: EventRegistrationFormValues) {
    setIsSubmitting(true);
    try {
      // Cast date strings to valid ISO-8601 for Prisma
      const payloadData = {
        ...data,
        activity_date: new Date(data.activity_date).toISOString(),
        participant_birthdate: new Date(data.participant_birthdate).toISOString()
      };

      const res = await axios.post('/api/forms/EventRegistration/submissions', { 
        data: payloadData, 
        public_password: passwordProvided,
        reservation_token: reservationToken
      });
      
      setFinalFolio(res.data.data.folio);
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error?.message;
      if (msg === 'RESERVATION_EXPIRED') {
        alert('Tu tiempo de reserva ha expirado. Por favor, recarga la página para intentar de nuevo.');
      } else {
        alert('Error al enviar el formulario. Verifica tus datos o contacta al administrador.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (configLoading) {
    return <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">Cargando formulario...</div>;
  }

  if (!isActive) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-red-500">
          <CardHeader>
            <CardTitle>Formulario Cerrado</CardTitle>
            <CardDescription>Este formulario ya no está recibiendo respuestas por el momento.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-600">Cupo Agotado</CardTitle>
            <CardDescription>
              Lo sentimos, los lugares para este registro se han agotado o están temporalmente reservados. 
              Intenta de nuevo más tarde por si se liberan espacios.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.reload()}>Reintentar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (requiresPassword && !passwordProvided) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Acceso Protegido</CardTitle>
            <CardDescription>Este formulario requiere una contraseña para ingresar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password" 
              placeholder="Contraseña" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
            />
            <Button className="w-full" onClick={() => setPasswordProvided(passwordInput)}>Entrar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    if (confirmationMode === 'TICKET') {
      window.location.href = `/forms/EventRegistration/ticket?folio=${finalFolio || 'CONF-N/A'}`;
      return <div className="min-h-screen bg-muted/40 p-4 flex items-center justify-center">Redirigiendo a tu comprobante...</div>;
    }

    return (
      <div className="flex justify-center items-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-green-500">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 text-green-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-700">¡Registro Exitoso!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Tus datos han sido guardados correctamente en la base de datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {confirmationMode === 'CODE' && (
              <div className="bg-muted p-4 rounded-md text-center">
                <p className="text-sm text-muted-foreground mb-1">Tu código de confirmación es:</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {finalFolio || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  (Conserva este código para futuras referencias)
                </p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Cerrar y Volver
              </Button>
              <Button 
                className="w-full"
                onClick={() => {
                  window.location.reload(); // Reload to get a new reservation token
                }}
              >
                Llenar Nuevo Registro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      {hasLimit && expiresAt && (
        <div className="w-full max-w-3xl mx-auto mb-4 bg-blue-100 text-blue-800 p-3 rounded-md border border-blue-200 flex justify-between items-center shadow-sm">
          <div>
            <strong className="block">¡Tienes un lugar reservado!</strong>
            <span className="text-sm">Completa el formulario antes de que se agote el tiempo.</span>
          </div>
          <div className="text-xl font-mono font-bold">
            {new Date(expiresAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Registro a Eventos</CardTitle>
          <CardDescription>Por favor completa la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* SECCIÓN: Información General */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="activity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actividad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HORA_DEL_CUENTO">Hora del Cuento</SelectItem>
                            <SelectItem value="CIRCULO_DE_LECTURA">Círculo de Lectura</SelectItem>
                            <SelectItem value="TALLER">Taller</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activity_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-2">
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECCIÓN: Información del Participante */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Información del Participante</h3>
                <FormField
                  control={form.control}
                  name="participant_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del participante</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="participant_birthdate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-2">
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="participant_gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="H">Hombre</SelectItem>
                            <SelectItem value="M">Mujer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="participant_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="participant_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="10 dígitos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="participant_neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="participant_occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ocupación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HOGAR">Hogar</SelectItem>
                            <SelectItem value="ESTUDIANTE">Estudiante</SelectItem>
                            <SelectItem value="TRABAJADOR">Trabajador</SelectItem>
                            <SelectItem value="JUBILADO">Jubilado</SelectItem>
                            <SelectItem value="DESOCUPADO">Desocupado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="participant_education"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de Estudios</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PREESCOLAR">Preescolar</SelectItem>
                            <SelectItem value="PRIMARIA">Primaria</SelectItem>
                            <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                            <SelectItem value="BACHILLERATO">Bachillerato</SelectItem>
                            <SelectItem value="LICENCIATURA">Licenciatura</SelectItem>
                            <SelectItem value="POSGRADO">Posgrado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="needs_disability_support"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>¿Requieres algún apoyo o ajuste por discapacidad?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="has_library_loan_record"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>¿Cuenta con registro para préstamo a domicilio?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECCIÓN: Información de Contacto */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact1_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Contacto</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact1_relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relación</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PADRE">Padre</SelectItem>
                            <SelectItem value="MADRE">Madre</SelectItem>
                            <SelectItem value="TUTOR">Tutor</SelectItem>
                            <SelectItem value="OTRO_FAMILIAR">Otro Familiar</SelectItem>
                            <SelectItem value="OTRO">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact1_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact1_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECCIÓN: Autorización e Indicaciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Autorización e Indicaciones</h3>
                <FormField
                  control={form.control}
                  name="accepts_image_usage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>¿Acepta el uso de imagen para fines de difusión institucional?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Registro"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
