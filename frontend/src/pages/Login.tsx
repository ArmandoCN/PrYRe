import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [totpCode, setTotpCode] = useState(''); // Not needed yet as per agreement
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        // En un proyecto más grande guardaríamos el usuario en un Contexto/Store
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Ocurrió un error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico para acceder al panel de administración.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
