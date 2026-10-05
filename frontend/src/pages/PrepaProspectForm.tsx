import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { prepaProspectSchema, type PrepaProspectData } from '@/lib/validations/prepaProspect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const DEFAULT_CONTACT_OPTIONS = ['Facebook', 'WhatsApp', 'Página Web', 'Volante', 'Recomendación'];

export function PrepaProspectForm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [folio, setFolio] = useState('');
  
  const [reservationToken, setReservationToken] = useState<string | null>(null);

  const [otherContactSelected, setOtherContactSelected] = useState(false);
  const [otherContactText, setOtherContactText] = useState('');

  const [isMinor, setIsMinor] = useState(false);
  const [forceTutor, setForceTutor] = useState(false);
  const [lastGradeOption, setLastGradeOption] = useState('');
  const [lastGradeText, setLastGradeText] = useState('');

  const form = useForm<PrepaProspectData>({
    resolver: zodResolver(prepaProspectSchema),
    defaultValues: {
      full_name: '',
      birthdate: '',
      neighborhood: '',
      phone: '',
      email: '',
      tutor_name: '',
      tutor_phone: '',
      last_grade: '',
      last_school: '',
      contact_methods: [],
      notes: ''
    }
  });

  const birthdateValue = useWatch({ control: form.control, name: 'birthdate' });

  useEffect(() => {
    if (birthdateValue) {
      const birthDateObj = new Date(birthdateValue);
      if (!isNaN(birthDateObj.getTime())) {
        const ageDifMs = Date.now() - birthDateObj.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        setIsMinor(age < 18);
      }
    }
  }, [birthdateValue]);

  useEffect(() => {
    fetchConfigAndReserve();
  }, []);

  const fetchConfigAndReserve = async () => {
    try {
      const res = await axios.get('/api/forms/PrepaStase/config');
      
      if (!res.data.data.is_active) {
        setError("Las preinscripciones están cerradas actualmente.");
        setLoading(false);
        return;
      }

      if (res.data.data.max_submissions !== null && res.data.data.max_submissions !== undefined) {
        let currentToken = localStorage.getItem('pryre_res_PrepaStase');
        
        try {
          if (!currentToken) {
            const reserveRes = await axios.post('/api/forms/PrepaStase/reserve');
            currentToken = reserveRes.data.data.reservation_token;
            localStorage.setItem('pryre_res_PrepaStase', currentToken!);
          }
          setReservationToken(currentToken);
        } catch (e: any) {
          if (e.response?.data?.error?.message === 'LIMIT_REACHED') {
            setError("Se ha alcanzado el límite de cupos disponibles.");
            setLoading(false);
            return;
          }
          throw e;
        }
      }
      setLoading(false);
    } catch (err) {
      setError("Error al cargar la configuración del formulario.");
      setLoading(false);
    }
  };

  const onSubmit = async (data: PrepaProspectData) => {
    try {
      let finalContactMethods = [...data.contact_methods];
      if (otherContactSelected && otherContactText.trim() !== '') {
        finalContactMethods.push(`Otro: ${otherContactText.trim()}`);
      }
      finalContactMethods = finalContactMethods.filter(m => m !== 'Otro');

      const transformedData = {
        ...data,
        birthdate: new Date(data.birthdate).toISOString(),
        contact_methods: finalContactMethods,
      };

      const payload = {
        data: transformedData,
        reservation_token: reservationToken
      };

      const response = await axios.post('/api/forms/PrepaStase/submissions', payload);
      
      localStorage.removeItem('pryre_res_PrepaStase');
      setFolio(response.data.data.folio);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.error?.message === 'RESERVATION_EXPIRED') {
        alert("Tu tiempo de registro ha expirado. Por favor recarga la página para intentar de nuevo.");
        localStorage.removeItem('pryre_res_PrepaStase');
        window.location.reload();
        return;
      }
      alert("Error al enviar: " + (err.response?.data?.error?.message || err.message));
    }
  };

  if (loading) return <div className="flex justify-center p-10">Cargando...</div>;
  if (error) return <div className="flex justify-center p-10 text-destructive">{error}</div>;

  if (success) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card className="text-center p-6 border-green-200 bg-green-50">
          <CardTitle className="text-2xl text-green-700 mb-4">¡Registro Exitoso!</CardTitle>
          <p className="text-green-800">Tus datos han sido recibidos correctamente.</p>
          {folio && (
            <div className="mt-6 p-4 bg-white rounded-lg inline-block border border-green-300">
              <p className="text-sm text-gray-500 font-medium">Tu folio de seguimiento es:</p>
              <p className="text-3xl font-bold text-gray-800">{folio}</p>
            </div>
          )}
          <div className="mt-8">
            <Button onClick={() => window.location.reload()} variant="outline">Nuevo Registro</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Prospectos - Prepa STASE</CardTitle>
          <CardDescription>Completa el siguiente formulario para registrar tu interés.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel>Fecha de Nacimiento *</FormLabel>
                        {!isMinor && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-xs px-2"
                            onClick={() => setForceTutor(!forceTutor)}
                          >
                            {forceTutor ? "Ocultar Tutor" : "+ Añadir Tutor"}
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(isMinor || forceTutor) && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <p className="text-sm text-orange-800 font-medium">Como el prospecto es menor de edad (o se agregó tutor manualmente), necesitamos los datos del padre o tutor.</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="tutor_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Padre/Tutor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del tutor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tutor_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono del Padre/Tutor *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="10 dígitos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Colonia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="10 dígitos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="last_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Último Grado *</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          setLastGradeOption(val);
                          if (val !== 'Cursando Prepa' && val !== 'Otro' && val !== 'Prepa Abandonada') {
                            field.onChange(val);
                          } else {
                            field.onChange(`${val}: ${lastGradeText}`);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Secundaria Terminada">Secundaria Terminada</SelectItem>
                          <SelectItem value="Prepa Abandonada">Prepa Abandonada</SelectItem>
                          <SelectItem value="Cursando Prepa">Cursando Prepa</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      {(lastGradeOption === 'Cursando Prepa' || lastGradeOption === 'Otro' || lastGradeOption === 'Prepa Abandonada') && (
                        <div className="mt-2">
                           <Input 
                             placeholder="Especifica los detalles..."
                             value={lastGradeText}
                             onChange={(e) => {
                               setLastGradeText(e.target.value);
                               field.onChange(`${lastGradeOption}: ${e.target.value}`);
                             }}
                           />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar Últimos Estudios *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la escuela" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidad *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ESCOLARIZADA">Escolarizada</SelectItem>
                          <SelectItem value="ABIERTA">Abierta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MATUTINO">Matutino</SelectItem>
                          <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                          <SelectItem value="SABATINO">Sabatino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contact_methods"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Medio de Contacto *</FormLabel>
                      <CardDescription>Selecciona cómo te enteraste (puedes elegir varios)</CardDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_CONTACT_OPTIONS.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="contact_methods"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={otherContactSelected}
                            onCheckedChange={(checked) => {
                              setOtherContactSelected(checked as boolean);
                              if (checked) {
                                form.setValue('contact_methods', [...form.getValues('contact_methods'), 'Otro']);
                              } else {
                                form.setValue('contact_methods', form.getValues('contact_methods').filter(v => v !== 'Otro'));
                                setOtherContactText('');
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Otro</FormLabel>
                      </FormItem>
                    </div>
                    {otherContactSelected && (
                      <div className="mt-2">
                        <Input 
                          placeholder="Especifica el medio" 
                          value={otherContactText}
                          onChange={(e) => setOtherContactText(e.target.value)}
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Comentarios..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Registrarse"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
