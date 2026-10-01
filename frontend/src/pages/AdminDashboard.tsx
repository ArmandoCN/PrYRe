import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminDashboard() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms();
  }, [navigate]);

  const fetchForms = async () => {
    try {
      const response = await axios.get('/api/forms');
      if (response.data.success) {
        setForms(response.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/login');
      } else {
        setError('Error cargando los formularios. Asegúrate de tener permisos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFormActive = async (formIdentifier: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/forms/${formIdentifier}/config`, {
        is_active: !currentStatus
      });
      fetchForms();
    } catch (err) {
      alert("Error al actualizar el estado del formulario");
    }
  };

  const togglePublicList = async (formIdentifier: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/forms/${formIdentifier}/config`, {
        is_listed: !currentStatus
      });
      fetchForms();
    } catch (err) {
      alert("Error al actualizar la visibilidad");
    }
  };

  const togglePasswordProtection = async (formIdentifier: string, currentPassword: string | null) => {
    if (currentPassword) {
      // It has a password, turning it OFF
      const confirmRemove = window.confirm("¿Estás seguro de que quieres quitar la contraseña y hacer el acceso libre?");
      if (!confirmRemove) return;
      try {
        await axios.patch(`/api/forms/${formIdentifier}/config`, { public_password: null });
        fetchForms();
      } catch (err) {
        alert("Error al quitar la contraseña");
      }
    } else {
      // It doesn't have a password, turning it ON
      const newPassword = window.prompt("Ingresa la nueva contraseña para proteger el formulario:");
      if (!newPassword || newPassword.trim() === "") return;
      try {
        await axios.patch(`/api/forms/${formIdentifier}/config`, { public_password: newPassword.trim() });
        fetchForms();
      } catch (err) {
        alert("Error al establecer la contraseña");
      }
    }
  };

  const updateConfirmationMode = async (formIdentifier: string, newMode: string) => {
    try {
      await axios.patch(`/api/forms/${formIdentifier}/config`, { confirmation_mode: newMode });
      fetchForms();
    } catch (err) {
      alert("Error al actualizar el modo de confirmación");
    }
  };

  const changePassword = async (formIdentifier: string, currentPassword: string | null) => {
    const newPassword = window.prompt("Ingresa la nueva contraseña para proteger el formulario:", currentPassword || "");
    if (!newPassword || newPassword.trim() === "") return;
    try {
      await axios.patch(`/api/forms/${formIdentifier}/config`, { public_password: newPassword.trim() });
      fetchForms();
    } catch (err) {
      alert("Error al actualizar la contraseña");
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando panel...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Administrativo Central</h1>
          <p className="text-muted-foreground">
            Gestión global de formularios y recolección de datos
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>

      {error ? (
        <div className="text-destructive font-medium">{error}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle>{form.form_identifier}</CardTitle>
                <CardDescription>
                  Creado el {format(new Date(form.created_at), 'dd/MM/yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Formulario Activo</Label>
                    <p className="text-sm text-muted-foreground">
                      {form.is_active ? 'Recibiendo respuestas' : 'Cerrado al público'}
                    </p>
                  </div>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={() => toggleFormActive(form.form_identifier, form.is_active)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Listado en Portal</Label>
                    <p className="text-sm text-muted-foreground">
                      {form.is_listed ? 'Visible en el directorio público' : 'Oculto (solo enlace directo)'}
                    </p>
                  </div>
                  <Switch
                    checked={form.is_listed}
                    onCheckedChange={() => togglePublicList(form.form_identifier, form.is_listed)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Protección por Contraseña</Label>
                    <p className="text-sm text-muted-foreground">
                      {form.public_password ? 'Activada' : 'Desactivada (Acceso libre)'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {form.public_password && (
                       <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => changePassword(form.form_identifier, form.public_password)}>
                         Cambiar
                       </Button>
                    )}
                    <Switch
                      checked={!!form.public_password}
                      onCheckedChange={() => togglePasswordProtection(form.form_identifier, form.public_password)}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mt-4 pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo de Confirmación</Label>
                    <p className="text-sm text-muted-foreground">
                      Define qué sucede después de enviar el registro.
                    </p>
                  </div>
                  <Select 
                    value={form.confirmation_mode || 'SIMPLE'} 
                    onValueChange={(val) => updateConfirmationMode(form.form_identifier, val)}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Selecciona un modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLE">Mensaje Simple</SelectItem>
                      <SelectItem value="CODE">Código Único (Folio)</SelectItem>
                      <SelectItem value="TICKET">Comprobante Imprimible (Boleto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <Link to={`/forms/${form.form_identifier}`}>
                  <Button variant="outline" size="sm">Ver Form</Button>
                </Link>
                <Link to={`/admin/forms/${form.form_identifier}/data`}>
                  <Button size="sm">Ver Datos Recabados</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          {forms.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No hay formularios registrados en el sistema.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
