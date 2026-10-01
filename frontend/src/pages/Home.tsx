import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
            {publicForms.map(form => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{form.form_identifier}</CardTitle>
                  <CardDescription>
                    Formulario para registrar actividades y asistencia.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={`/forms/${form.form_identifier}`}>
                    <Button className="w-full">Ir al Formulario</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            
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
