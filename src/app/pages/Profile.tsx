import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, FileText, Palette, Package } from 'lucide-react';

export function Profile() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    specialty: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        specialty: user.specialty || '',
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile(formData);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Mi Perfil</h1>
          <p className="text-gray-600">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{user.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {user.role === 'artisan' ? 'Artesano' : user.role === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </CardContent>
            </Card>

            {user.role === 'artisan' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/producto/crear">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <Package className="mr-2 h-4 w-4" />
                      Crear Producto
                    </Button>
                  </Link>
                  <Link to="/catalogo">
                    <Button variant="outline" className="w-full">
                      Ver Mis Productos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre Completo
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">
                      El correo electrónico no se puede cambiar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Calle 123 #45-67"
                    />
                  </div>

                  {user.role === 'artisan' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specialty" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Especialidad
                        </Label>
                        <Input
                          id="specialty"
                          name="specialty"
                          value={formData.specialty}
                          onChange={handleChange}
                          placeholder="Ej: Cerámica, Tallado, Barniz de Pasto"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Biografía
                        </Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Cuéntanos sobre tu trabajo artesanal..."
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                    Guardar Cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
