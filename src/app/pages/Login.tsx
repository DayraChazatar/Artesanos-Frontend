import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = user.role === 'artisan' ? '/perfil-artesano' : '/catalogo';
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
      const destination = result.user.role === 'artisan' ? '/perfil-artesano' : '/catalogo';
      navigate(destination);
    } catch (error: any) {
      toast.error(error.message || 'Credenciales incorrectas');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      toast.error('Error al iniciar sesión con Google');
      return;
    }
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      toast.success(`¡Bienvenido, ${result.user.name}!`);
      const destination = result.user.role === 'artisan' ? '/perfil-artesano' : '/catalogo';
      navigate(destination);
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
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
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="h-11 pr-10" required />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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