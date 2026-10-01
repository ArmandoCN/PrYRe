import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function ForcePasswordChange({ children }: { children: React.ReactNode }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (sessionStorage.getItem('dismissedPwdPrompt')) return;
        const res = await axios.get('/api/auth/me');
        if (res.data?.data?.user?.has_default_password) {
          setShowPrompt(true);
        }
      } catch (e) {
        // Not logged in or error, ignore here (let standard auth guards handle it)
      }
    };
    checkUserStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/change-password', { new_password: newPassword });
      setSuccess(true);
      setTimeout(() => {
        // Redirigir a login para que vuelva a entrar con nueva contraseña
        window.location.href = '/admin/login';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cambiar la contraseña');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem('dismissedPwdPrompt', 'true');
    setShowPrompt(false);
  };

  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md shadow-xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">¡Atención de Seguridad!</CardTitle>
            <CardDescription>
              Estás usando la contraseña por defecto de administrador ("admin123"). 
              Por tu seguridad, te recomendamos encarecidamente que la cambies ahora mismo.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {success ? (
                <div className="text-green-600 font-medium text-center">
                  ¡Contraseña actualizada! Redirigiendo al login...
                </div>
              ) : (
                <>
                  {error && <div className="text-sm text-destructive font-medium">{error}</div>}
                  <div className="grid gap-2">
                    <Label htmlFor="new_password">Nueva Contraseña de Administrador</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                </>
              )}
            </CardContent>
            {!success && (
              <CardFooter className="flex justify-between">
                <Button type="button" variant="ghost" onClick={handleSkip}>
                  Recordarme más tarde
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                </Button>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
