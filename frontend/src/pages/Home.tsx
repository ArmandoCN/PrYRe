import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FormMeta {
  title: string;
  badge: string;
  description: string;
}

const FORM_METADATA: Record<string, FormMeta> = {
  EventRegistration: {
    title: 'Registro a Eventos Culturales',
    badge: 'Eventos',
    description: 'Inscripción para Hora del Cuento, Círculo de Lectura y Talleres.',
  },
  PrepaStase: {
    title: 'Preinscripción Prepa STASE',
    badge: 'Educación',
    description: 'Registro de prospectos e interesados en cursar el bachillerato.',
  },
  ActivityCatalog: {
    title: 'Alta de Actividades',
    badge: 'Catálogo',
    description: 'Registro de nuevas actividades con definición de fecha, cupo total y cupo reservado.',
  },
  ActivityParticipant: {
    title: 'Participantes de Actividades',
    badge: 'Inscripciones',
    description: 'Registro de participantes por actividad con verificación de cupo disponible en tiempo real.',
  },
};

export function Home() {
  const [publicForms, setPublicForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/public-forms');
        if (response.data.success) {
          setPublicForms(response.data.data);
        }
      } catch (err) {
        console.error("Error loading public forms", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4 py-10">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Portal de Registros
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bienvenido al sistema centralizado de registros. A continuación encontrarás la lista de formularios activos abiertos al público.
          </p>
        </div>

        {loading ? (
          <div className="text-center">Cargando directorio...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicForms.map(form => {
              const meta: FormMeta = FORM_METADATA[form.form_identifier] || {
                title: form.form_identifier,
                badge: 'General',
                description: 'Formulario para registrar actividades y asistencia.',
              };

              return (
                <Card key={form.id} className="hover:shadow-lg transition-shadow flex flex-col justify-between">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {meta.badge}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{meta.title}</CardTitle>
                    <CardDescription>
                      {meta.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/forms/${form.form_identifier}`}>
                      <Button className="w-full">Ir al Formulario</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
            
            {publicForms.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No hay formularios públicos disponibles en este momento.
              </div>
            )}
          </div>
        )}

        <div className="mt-20 text-center">
          <Link to="/admin/login" className="text-sm text-muted-foreground hover:underline">
            Acceso Administrativo
          </Link>
        </div>
      </div>
    </div>
  );
}
