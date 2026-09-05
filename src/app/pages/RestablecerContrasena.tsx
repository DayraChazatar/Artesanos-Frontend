import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, KeyRound } from 'lucide-react';
import { API_BASE } from '../utils/config';

export function RestablecerContrasena() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nueva: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (form.nueva.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (form.nueva !== form.confirmar) {
      toast.error('Las contraseñas no coinciden'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/password-reset/confirmar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password_nueva: form.nueva,
          password_confirmar: form.confirmar,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'No se pudo restablecer la contraseña'); return; }
      setListo(true);
      toast.success('Contraseña actualizada correctamente');
    } catch {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Restablecer Contraseña</CardTitle>
          <CardDescription className="text-center">
            {listo ? 'Ya puedes iniciar sesión con tu nueva contraseña' : 'Ingresa tu nueva contraseña'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listo ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <Button onClick={() => navigate('/login')} className="w-full bg-orange-600 hover:bg-orange-700">
                Ir a iniciar sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nueva">Nueva contraseña</Label>
                <Input
                  id="nueva"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.nueva}
                  onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar contraseña</Label>
                <Input
                  id="confirmar"
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  value={form.confirmar}
                  onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                <KeyRound className="mr-2 h-4 w-4" />
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </Button>
              <Link to="/login">
                <Button type="button" variant="ghost" className="w-full">Volver al inicio de sesión</Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
