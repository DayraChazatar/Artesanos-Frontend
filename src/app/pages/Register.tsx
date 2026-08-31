// src/app/pages/Register.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { User, Palette } from 'lucide-react';
import { getCategoriasDisponibles, registrarArtesano, type Categoria } from '../data/artesanoApi';
import { API_BASE } from '../utils/config';

export function Register() {
  // ── Estado cliente ──────────────────────────────────────────────────────────
  const [clienteData, setClienteData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });

  // ── Estado artesano ─────────────────────────────────────────────────────────
  const [artesanoData, setArtesanoData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', specialty: '', bio: '',
    categoria_id: '',           // ← nuevo
  });

  // ── Categorías disponibles (sin artesano asignado) ──────────────────────────
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const navigate = useNavigate();

  // Carga las categorías al montar el componente
  useEffect(() => {
    setLoadingCats(true);
    getCategoriasDisponibles()
      .then(setCategoriasDisponibles)
      .catch(() => toast.error('No se pudieron cargar las categorías'))
      .finally(() => setLoadingCats(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setClienteData({ ...clienteData, [e.target.name]: e.target.value });

  const handleArtesanoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setArtesanoData({ ...artesanoData, [e.target.name]: e.target.value });

  // ── Registro cliente ────────────────────────────────────────────────────────
  const handleClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (clienteData.password !== clienteData.confirmPassword)
      return toast.error('Las contraseñas no coinciden');
    if (clienteData.password.length < 6)
      return toast.error('La contraseña debe tener al menos 6 caracteres');

    try {
     const res = await fetch(`${API_BASE}/usuarios/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: clienteData.name,
          correo: clienteData.email,
          password: clienteData.password,
          tipo: 'cliente',
        }),
      });

      if (res.ok) {
        toast.success('¡Registro exitoso! Bienvenido a Artesanías');
        navigate('/catalogo');
      } else {
        const err = await res.json();
        toast.error(err?.correo ? 'El correo ya está registrado' : 'Error al crear la cuenta');
      }
    } catch {
      toast.error('Error de conexión con el servidor');
    }
  };

  // ── Registro artesano ───────────────────────────────────────────────────────
  const handleArtesanoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (artesanoData.password !== artesanoData.confirmPassword)
      return toast.error('Las contraseñas no coinciden');
    if (artesanoData.password.length < 6)
      return toast.error('La contraseña debe tener al menos 6 caracteres');
    if (!artesanoData.categoria_id)
      return toast.error('Debes seleccionar una categoría');

    try {
      await registrarArtesano({
        nombre:       artesanoData.name,
        correo:       artesanoData.email,
        password:     artesanoData.password,
        telefono:     artesanoData.phone,
        biografia:    artesanoData.bio,
        categoria_id: Number(artesanoData.categoria_id),
      });

      toast.success('¡Registro exitoso! Bienvenido artesano');
      navigate('/login');
    } catch (err: any) {
      try {
        const detalle = JSON.parse(err.message);
        // Muestra el primer error del backend legiblemente
        const primerError = Object.values(detalle)?.[0];
        toast.error(Array.isArray(primerError) ? primerError[0] : String(primerError));
      } catch {
        toast.error('Error al crear la cuenta');
      }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Únete a nuestra comunidad como cliente o artesano
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">
                <User className="h-4 w-4 mr-1" /> Cliente
              </TabsTrigger>
              <TabsTrigger value="artisan">
                <Palette className="h-4 w-4 mr-1" /> Artesano
              </TabsTrigger>
            </TabsList>

            {/* ── TAB CLIENTE ── */}
            <TabsContent value="customer">
              <form onSubmit={handleClienteSubmit} className="space-y-4 mt-4">
                <Input name="name" placeholder="Nombre completo" onChange={handleClienteChange} required />
                <Input name="email" type="email" placeholder="Correo electrónico" onChange={handleClienteChange} required />
                <Input name="password" type="password" placeholder="Contraseña" onChange={handleClienteChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirmar contraseña" onChange={handleClienteChange} required />
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                  Registrarse como Cliente
                </Button>
              </form>
            </TabsContent>

            {/* ── TAB ARTESANO ── */}
            <TabsContent value="artisan">
              <form onSubmit={handleArtesanoSubmit} className="space-y-4 mt-4">
                <Input name="name" placeholder="Nombre completo" onChange={handleArtesanoChange} required />
                <Input name="email" type="email" placeholder="Correo electrónico" onChange={handleArtesanoChange} required />
                <Input name="phone" placeholder="Teléfono" onChange={handleArtesanoChange} />
                <Textarea name="bio" placeholder="Cuéntanos sobre ti y tu arte..." onChange={handleArtesanoChange} />

                {/* ── SELECTOR DE CATEGORÍA ── */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Categoría artesanal <span className="text-red-500">*</span>
                  </label>

                  {loadingCats ? (
                    <div className="px-3 py-2 border rounded-md text-sm text-gray-400">
                      Cargando categorías...
                    </div>
                  ) : categoriasDisponibles.length === 0 ? (
                    <div className="px-3 py-2 border border-orange-200 bg-orange-50 rounded-md text-sm text-orange-700">
                      ⚠️ No hay categorías disponibles. Contacta al administrador.
                    </div>
                  ) : (
                    <select
                      name="categoria_id"
                      value={artesanoData.categoria_id}
                      onChange={handleArtesanoChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">— Selecciona tu categoría —</option>
                      {categoriasDisponibles.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                          {cat.descripcion ? ` — ${cat.descripcion}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="text-xs text-gray-400">
                    Cada artesano gestiona una única categoría. Si no ves la tuya, contacta al administrador.
                  </p>
                </div>

                <Input name="password" type="password" placeholder="Contraseña" onChange={handleArtesanoChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirmar contraseña" onChange={handleArtesanoChange} required />

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={categoriasDisponibles.length === 0 || loadingCats}
                >
                  Registrarse como Artesano
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-orange-600 hover:underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}