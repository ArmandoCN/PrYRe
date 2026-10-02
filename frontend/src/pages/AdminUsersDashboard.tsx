import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminUsersDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, formsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/forms')
      ]);
      setUsers(usersRes.data.data);
      setForms(formsRes.data.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/dashboard'); // Fallback if not SUPERADMIN
      } else {
        setError('Error al cargar datos. Solo los SUPERADMIN tienen acceso.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const email = window.prompt("Email del nuevo usuario:");
    if (!email) return;
    const role = window.prompt("Rol (ADMIN o ANALYST):", "ANALYST");
    if (!role || (role !== 'ADMIN' && role !== 'ANALYST' && role !== 'SUPERADMIN')) return;
    const password = window.prompt("Contraseña temporal:");
    if (!password) return;

    try {
      await axios.post('/api/users', { email, role, password });
      fetchData();
    } catch (e: any) {
      alert("Error al crear usuario: " + e.message);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${email}?`)) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchData();
    } catch (e) {
      alert("Error al eliminar usuario");
    }
  };

  const handleChangePassword = async (id: string) => {
    const password = window.prompt("Nueva contraseña:");
    if (!password) return;
    try {
      await axios.patch(`/api/users/${id}/password`, { password });
      alert("Contraseña actualizada");
    } catch (e) {
      alert("Error al actualizar contraseña");
    }
  };

  const toggleFormAccess = async (userId: string, currentAccesses: string[], formIdentifier: string) => {
    try {
      const newAccesses = currentAccesses.includes(formIdentifier)
        ? currentAccesses.filter(a => a !== formIdentifier)
        : [...currentAccesses, formIdentifier];
      
      await axios.post(`/api/users/${userId}/access`, { form_identifiers: newAccesses });
      fetchData();
    } catch (e) {
      alert("Error al actualizar permisos");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando usuarios...</div>;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Control de acceso y permisos por formulario</p>
        </div>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>Volver a Formularios</Button>
          <Button onClick={handleCreateUser}>Nuevo Usuario</Button>
        </div>
      </div>

      {error ? (
        <div className="text-destructive font-medium">{error}</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Directorio de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acceso a Formularios (Permisos)</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.role === 'SUPERADMIN' ? (
                        <span className="text-muted-foreground italic">Acceso Total</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {forms.map(form => {
                            const hasAccess = user.form_accesses.includes(form.form_identifier);
                            return (
                              <Button 
                                key={form.form_identifier} 
                                variant={hasAccess ? "default" : "outline"} 
                                size="sm"
                                onClick={() => toggleFormAccess(user.id, user.form_accesses, form.form_identifier)}
                              >
                                {form.form_identifier} {hasAccess ? "✓" : "✗"}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => handleChangePassword(user.id)}>Pass</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id, user.email)}>Borrar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
