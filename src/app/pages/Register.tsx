import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { User, Palette } from 'lucide-react';

export function Register() {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [artisanData, setArtisanData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialty: '',
    bio: '',
  });

  const navigate = useNavigate();

  const handleCustomerChange = (e: any) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleArtisanChange = (e: any) => {
    setArtisanData({ ...artisanData, [e.target.name]: e.target.value });
  };

  // 🔥 REGISTRO CLIENTE
  const handleCustomerSubmit = async (e: any) => {
    e.preventDefault();

    if (customerData.password !== customerData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (customerData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/usuarios/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: customerData.name,
          correo: customerData.email,
          password: customerData.password,
          tipo: "cliente",
        }),
      });

      const data = await res.json();
      console.log("STATUS:", res.status);
      console.log("RESPUESTA:", data);

      if (res.ok) {
        toast.success('¡Registro exitoso! Bienvenido a Artesanías');
        navigate('/catalogo');
      } else {
        toast.error("Error: " + JSON.stringify(data));
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    }
  };

  // 🔥 REGISTRO ARTESANO
  const handleArtisanSubmit = async (e: any) => {
    e.preventDefault();

    if (artisanData.password !== artisanData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (artisanData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/usuarios/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: artisanData.name,
          correo: artisanData.email,
          password: artisanData.password,
          telefono: artisanData.phone,
          especialidad: artisanData.specialty,
          biografia: artisanData.bio,
          tipo: "artesano",
        }),
      });

      const data = await res.json();
      console.log("STATUS:", res.status);
      console.log("RESPUESTA:", data);

      if (res.ok) {
        toast.success('¡Registro exitoso! Bienvenido artesano');
        navigate('/perfil');
      } else {
        toast.error("Error: " + JSON.stringify(data));
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    }
  };

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
                <User className="h-4 w-4" /> Cliente
              </TabsTrigger>
              <TabsTrigger value="artisan">
                <Palette className="h-4 w-4" /> Artesano
              </TabsTrigger>
            </TabsList>

            {/* CLIENTE */}
            <TabsContent value="customer">
              <form onSubmit={handleCustomerSubmit} className="space-y-4 mt-4">
                <Input name="name" placeholder="Nombre" onChange={handleCustomerChange} required />
                <Input name="email" type="email" placeholder="Correo" onChange={handleCustomerChange} required />
                <Input name="password" type="password" placeholder="Contraseña" onChange={handleCustomerChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirmar contraseña" onChange={handleCustomerChange} required />
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                Registrarse como Cliente
                </Button>
              </form>
            </TabsContent>

            {/* ARTESANO */}
            <TabsContent value="artisan">
              <form onSubmit={handleArtisanSubmit} className="space-y-4 mt-4">
                <Input name="name" placeholder="Nombre" onChange={handleArtisanChange} required />
                <Input name="email" type="email" placeholder="Correo" onChange={handleArtisanChange} required />
                <Input name="phone" placeholder="Teléfono" onChange={handleArtisanChange} />
                <Input name="specialty" placeholder="Especialidad" onChange={handleArtisanChange} />
                <Textarea name="bio" placeholder="Biografía" onChange={handleArtisanChange} />
                <Input name="password" type="password" placeholder="Contraseña" onChange={handleArtisanChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirmar contraseña" onChange={handleArtisanChange} required />
                <Button type="submit"className="w-full bg-orange-600 hover:bg-orange-700">
                Registrarse como Artesano
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta? {' '}
            <Link to="/login" className="text-orange-600 hover:underline">
            Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}