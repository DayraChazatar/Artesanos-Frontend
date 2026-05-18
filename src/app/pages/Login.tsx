import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination =
        user.role === 'artisan' ? '/perfil-artesano'
        : user.role === 'admin' ? '/dashboard'
        : '/catalogo';
      navigate(destination);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      // login() ya guarda el user con email en AuthContext,
      // no hace falta volver a hacer localStorage.setItem aquí
      toast.success('¡Bienvenido de nuevo!');
      const destination =
        result.user.role === 'artisan' ? '/perfil-artesano'
        : result.user.role === 'admin' ? '/dashboard'
        : '/catalogo';
      navigate(destination);
    } catch (error: any) {
      toast.error(error.message || 'Credenciales incorrectas');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const googleUser = {
        id:           decoded.sub,
        name:         decoded.name,
        email:        decoded.email,
        role:         'customer' as const,
        profileImage: decoded.picture,
      };
      loginWithGoogle(googleUser);
      toast.success(`¡Bienvenido, ${decoded.name}!`);
      navigate('/catalogo');
    } catch {
      toast.error('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg border-0 rounded-2xl">

        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl text-center font-bold">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Accede a tu cuenta para explorar productos artesanales
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="h-11" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="h-11" required />
            </div>

            <div className="text-right">
              <Link to="/recuperar-contraseña" className="text-sm text-orange-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit"
              className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl">
              Iniciar Sesión
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-sm text-gray-500">o continúa con</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Error al iniciar sesión con Google')}
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <button
            onClick={() => toast.info('Próximamente disponible')}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors mt-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Continuar con Facebook</span>
          </button>

          <div className="mt-6 text-center text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-orange-600 hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}