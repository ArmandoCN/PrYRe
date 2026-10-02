import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminUsersDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ANALYST');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        navigate('/admin/dashboard');
      } else {
        setError('Error al cargar datos. Solo los SUPERADMIN tienen acceso.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);
    try {
      await axios.post('/api/users', { email: newEmail, role: newRole, password: newPassword });
      setShowCreateModal(false);
      setNewEmail('');
      setNewRole('ANALYST');
      setNewPassword('');
      fetchData();
    } catch (e: any) {
      setCreateError(e.response?.data?.error?.message || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
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
    <div className="container mx-auto py-10 space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Control de acceso y permisos por formulario</p>
        </div>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>Volver a Formularios</Button>
          <Button onClick={() => setShowCreateModal(true)}>Nuevo Usuario</Button>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-background">
            <form onSubmit={handleCreateUser}>
              <CardHeader>
                <CardTitle>Crear Nuevo Usuario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {createError && <div className="text-destructive text-sm font-medium">{createError}</div>}
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    required 
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Contraseña (Temporal)</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    placeholder="Escribe una contraseña segura"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANALYST">Analista (ANALYST)</SelectItem>
                      <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                      <SelectItem value="SUPERADMIN">Super Administrador (SUPERADMIN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
